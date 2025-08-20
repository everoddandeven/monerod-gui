import { EventEmitter, Injectable } from '@angular/core';
import { I2pDaemonSettings, LocalDestinationsData, MainData, ProcessStats, RouterCommandResultData, TokenData, TunnelInfo, TunnelsData } from '../../../../common';
import { IDBPDatabase, openDB } from 'idb';

@Injectable({
  providedIn: 'root'
})
export class I2pDaemonService {
  private readonly i2pdWebConsoleUri: string = 'http://127.0.0.1:7070';

  private readonly dbName = 'I2PDaemonSettingsDB';
  private readonly storeName = 'settingsStore';
  private readonly openDbPromise: Promise<IDBPDatabase>;

  public readonly onStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly onStop: EventEmitter<void> = new EventEmitter<void>();
  
  public readonly proxy: string = '127.0.0.1:4447';
  public readonly txProxy: string = 'i2p,127.0.0.1:4447,disable_noise';

  public tunnelsData: TunnelsData = new TunnelsData();

  private _settings: I2pDaemonSettings = new I2pDaemonSettings();
  private _running: boolean = false;
  private _starting: boolean = false;
  private _stopping: boolean = false;
  private _restarting: boolean = false;
  private _loaded: boolean = false;
  private _logs: string[] = [];
  private _anonymousInbound: string = '';
  private _p2pHost: string = '';
  private _rpcHost: string = '';

  private _detectedInstallation?: { path: string; configFile?: string; tunnelConfig?: string; tunnelsConfigDir?: string; pidFile?: string; isRunning?: boolean; };

  public get anonymousInbound(): string {
    return this._anonymousInbound;
  }

  public readonly std: I2pStd = { out: new EventEmitter<string>(), err: new EventEmitter<string>() };

  public get running(): boolean {
    return this._running;
  }
  
  public get starting(): boolean {
    return this._starting;
  }

  public get stopping(): boolean {
    return this._stopping;
  }

  public get restarting(): boolean {
    return this._restarting;
  }

  public get logs(): string[] {
    return this._logs;
  }

  public get settings(): I2pDaemonSettings {
    return this._settings;
  }

  public get loaded(): boolean {
    return this._loaded;
  }

  public get p2pHost(): string {
    return this._p2pHost;
  }

  public get rpcHost(): string {
    return this._rpcHost;
  }

  constructor() 
  {
    this.openDbPromise = this.openDatabase();
    this.loadSettings().then(() => console.log('Loaded i2p settings database')).catch((error: any) => console.error(error));
  }

  private async openDatabase(): Promise<IDBPDatabase<any>> {
    return await openDB<any>(this.dbName, 1, {
      upgrade(db) {
        // Crea un archivio (store) per i settings se non esiste già
        if (!db.objectStoreNames.contains('settingsStore')) {
          db.createObjectStore('settingsStore', {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      },
    });
  }

  private async waitForWebConsole(tries: number = 10): Promise<void> {
    for(let i = 0; i < tries; i++) {
      try {
        await this.getMainData();
        return;
      }
      catch {
        continue;
      }
    }

    throw new Error("Failed connection to i2p webconsole");
  }

  private async checkI2PAlreadyRunningInSystem(): Promise<boolean> {
    try {
      await this.waitForWebConsole(1);
      return true;
    }
    catch {
      return false;
    }
  }

  public async start(config?: I2pDaemonSettings): Promise<void> {
    const _config = config ? config : this._settings;
    if (!_config.path) _config.path = this._settings.path;
    if (_config.path === '') throw new Error("I2P not configured");
    if (this.running) throw new Error("Already running i2pd");
    if (this.stopping) throw new Error("i2pd is stopping");
    if (this.starting) throw new Error("Alrady starting i2pd");
    if (await this.checkI2PAlreadyRunningInSystem()) throw new Error("Another i2p service is already running");

    this._starting = true;
    const promise = new Promise<void>((resolve, reject) => {
      
      window.electronAPI.onI2pdOutput(({stdout, stderr} : { stdout?: string, stderr?: string }) => {
        if (stdout) {
          this._logs.push(stdout);
          this.std.out.emit(stdout);
        } else if (stderr) {
          this._logs.push(stderr);
          this.std.err.emit(stderr);
          this._running = false;
        }
      });

      window.electronAPI.onI2pdClose((code: number) => {
        console.log(code);
        this._running = false;
        this._stopping = false;
        this._starting = false;
        this.onStop.emit();
      });

      window.electronAPI.startI2pd(_config, (error?: any) => {
        this._starting = false;
        if (error) reject(new Error(`${error}`));
        else resolve();
      });
    });

    await promise;
    
    this.tunnelsData = new TunnelsData();
    this._anonymousInbound = '';

    try {
      await this.waitForWebConsole();
      this.tunnelsData = await this.getI2pTunnels();
      this._anonymousInbound = await this.getAnonymousInbound();
    }
    catch (error: any) {
      console.error(error);
    }

    this.setSettings(_config);
    this._rpcHost = await this.getRPCHost();
    this._p2pHost = await this.getP2PHost();
    this._running = true;
    this.onStart.emit();
  }

  private async shutdown(): Promise<void> {
    if (this.starting) throw new Error("i2pd is starting");
    if (!this.running) throw new Error("Already stopped i2pd");

    await new Promise<number>((resolve, reject) => {
      window.electronAPI.onI2pdClose((code: number) => {
        resolve(code);
      });

      this.forceShutdown().then((result) => {
        if (!result.message.includes('SUCCESS')) reject(new Error(result.message));
      }).catch((error: any) => reject(error instanceof Error ? error : new Error(`${error}`)));
    });
  }

  private async stopGracefully(): Promise<void> {
    if (this.starting) throw new Error("i2pd is starting");
    if (!this.running) throw new Error("Already stopped i2pd");

    await new Promise<number>((resolve, reject) => {
      window.electronAPI.onI2pdClose((code: number) => {
        resolve(code);
      });

      this.startGracefulShutdown().then((result) => {
        if (!result.message.includes('SUCCESS')) reject(new Error(result.message));
      }).catch((error: any) => reject(error instanceof Error ? error : new Error(`${error}`)));
    });
  }
  
  public async stop(force: boolean = false): Promise<void> {
    if (this.starting) throw new Error("i2pd is starting");
    if (!this.running) throw new Error("Already stopped i2pd");
    if (this.stopping) throw new Error("Alrady stopping i2pd");
    this._stopping = true;
    let err: any = null;

    try {
      if (force) {
        const promise = new Promise<void>((resolve, reject) => {
          window.electronAPI.stopI2pd((error?: any) => {
            this._stopping = false;
            if (error) reject(new Error(`${error}`));
            else resolve();
          });
        });
    
        await promise;
      }
      else {
        await this.stopGracefully();
      }
    }
    catch (error: any) {
      err = error;
      this._stopping = false;
    }

    this._p2pHost = '';
    this._rpcHost = '';
    this._running = false;
    if (!this.restarting) this.onStop.emit();

    if (err) throw err;
  }

  public async restart(): Promise<void> {
    if (this.restarting) throw new Error("Already restarting ip2d");
    if (this.starting) throw new Error("i2pd is starting");
    if (this.stopping) throw new Error("i2pd is stopping");
    if (!this.running) throw new Error("i2pd is not running");

    this._restarting = true;
    let err: any = null;

    try {
      await this.stop();
      await this.start();
    }
    catch(error: any) {
      err = error;
    }

    this._restarting = false;

    if (err) throw err;
  }

  public async isValidPath(path: string): Promise<boolean> {
    return await new Promise<boolean>((resolve) => {
      window.electronAPI.checkValidI2pdPath(path, resolve);
    });
  }

  public setSettings(config: I2pDaemonSettings): void {
    this._settings = config;
  }

  public async loadSettings(): Promise<I2pDaemonSettings> {
    const db = await this.openDbPromise;
    const result = await db.get(this.storeName, 1);
    
    if (result) {
      this.setSettings(I2pDaemonSettings.parse(result));
    }
    else
    {
      this.setSettings(new I2pDaemonSettings());
    }

    if (!this._detectedInstallation) {
      this._detectedInstallation = await this.detectInstallation();
    }

    if (this._settings.path === '' && this._detectedInstallation) {
      this._settings.path = this._detectedInstallation.path;
    }

    this._loaded = true;

    return this._settings;
  }

  public async saveSettings(): Promise<void> {
    const db = await this.openDbPromise;
    const settings = this.settings;
    await db.put(this.storeName, { id: 1, ...settings });
  }

  public async setPath(path: string, save: boolean = false, restart: boolean = false): Promise<void> {
    if (!await this.isValidPath(path)) throw new Error("Invalid i2pd path: " + path);

    this._settings.path = path;

    if (save) 
    {
      await this.saveSettings();
    }

    if (this.running && restart) {
      await this.restart();
    }
  }

  public clearLogs(): void {
    this._logs = [];
  }

  private async detectInstallation(): Promise<{ path: string; configFile?: string; tunnelConfig?: string; tunnelsConfigDir?: string; pidFile?: string; isRunning?: boolean; } | undefined> {
    return await new Promise<{ path: string; } | undefined>((resolve) => {
      window.electronAPI.detectInstallation('i2pd', resolve);
    });
  }

  private async fetchContent(request: string = ''): Promise<HTMLDivElement> {
    const resolveFunction = (resolve: (value: HTMLDivElement) => void, reject: (error: Error) => void) => {
      fetch(`${this.i2pdWebConsoleUri}/${request}`)
      .then(response => response.text())
      .then(html => {  
        const _content = document.createElement('div');
        _content.innerHTML = html;
    
        for (let i = 0; i < _content.children.length; i++) {
          const child = _content.children.item(i);
          if (!child) continue;
  
          if (child.className === 'wrapper') {
            resolve(child as HTMLDivElement);
            return;
          }
        }

        reject(new Error('Wrapper not found'));
      })
      .catch(error => reject(error instanceof Error ? error : new Error(`${error}`)));
    };

    function createPromise(): Promise<HTMLDivElement> {
      return new Promise<HTMLDivElement>(resolveFunction);
    }

    return await createPromise();

  }

  public async getMainData(): Promise<MainData> {
    return MainData.fromWrapper(await this.fetchContent())
  }

  public async getLocalDestinations(): Promise<LocalDestinationsData> {
    return LocalDestinationsData.fromWrapper(await this.fetchContent('?page=local_destinations'));
  }

  public async getTokenData(): Promise<TokenData> {
    return TokenData.fromWrapper(await this.fetchContent('?page=commands'));
  }

  public async runPeerTest(): Promise<RouterCommandResultData> {
    const tokenData = await this.getTokenData();

    return RouterCommandResultData.fromWrapper(await this.fetchContent(`?cmd=run_peer_test&token=${tokenData.token}`));
  }

  public async reloadTunnelsConfiguration(): Promise<RouterCommandResultData> {
    const tokenData = await this.getTokenData();
    
    return RouterCommandResultData.fromWrapper(await this.fetchContent(`?cmd=reload_tunnels_config&token=${tokenData.token}`));
  }

  public async declineTransitTunnels(): Promise<RouterCommandResultData> {
    const tokenData = await this.getTokenData();
    
    return RouterCommandResultData.fromWrapper(await this.fetchContent(`?cmd=disable_transit&token=${tokenData.token}`));
  }

  public async setLogLevel(logLevel: 'none' | 'critical' | 'error' | 'warn' | 'info' | 'debug'): Promise<RouterCommandResultData> {
    const tokenData = await this.getTokenData();
    
    return RouterCommandResultData.fromWrapper(await this.fetchContent(`?cmd=set_loglevel&level=${logLevel}&token=${tokenData.token}`));
  }

  public async startGracefulShutdown(): Promise<RouterCommandResultData> {
    const tokenData = await this.getTokenData();
    
    return RouterCommandResultData.fromWrapper(await this.fetchContent(`?cmd=shutdown_start&token=${tokenData.token}`));
  }

  public async forceShutdown(): Promise<RouterCommandResultData> {
    const tokenData = await this.getTokenData();
    
    return RouterCommandResultData.fromWrapper(await this.fetchContent(`?cmd=terminate&token=${tokenData.token}`));
  }

  public async getI2pTunnels(): Promise<TunnelsData> {
    return TunnelsData.fromWrapper(await this.fetchContent('?page=i2p_tunnels'));
  }

  public async getMoneroServerTunnels(): Promise<TunnelInfo[]> {
    const tunnels = await this.getI2pTunnels();
    return tunnels.servers.filter((t) => t.name.includes('monero'));
  }

  public async getMoneroNodeServerTunnel(): Promise<TunnelInfo | undefined> {
    const tunnels = await this.getMoneroServerTunnels();

    return tunnels.find((t) => t.name === 'monero-node');
  }

  public async getHostname(): Promise<string> {
    const tunnel = await this.getMoneroNodeServerTunnel();

    if (!tunnel) return '';

    const c = tunnel.address.split(':');

    if (c.length != 2) return '';

    return c[0];
  }

  public async getP2PHost(): Promise<string> {
    const host = await this.getHostname();
    const { port } = this._settings;

    return `${host}:${port}`;
  }

  public async getRPCHost(): Promise<string> {
    if (!this._settings.allowIncomingConnections) return 'disabled';
    const host = await this.getHostname();
    const { rpcPort } = this._settings;

    return `${host}:${rpcPort}`;
  }

  public async getAnonymousInbound(): Promise<string> {
    const tunnel = await this.getMoneroNodeServerTunnel();

    if (!tunnel) return '';

    const c = tunnel.address.split(':');

    if (c.length != 2) return '';

    const address = c[0];
    //const port = Number(c[1]);
    const port = 1885;

    return `${address},127.0.0.1:${port}`;
  }

  public async getAnonymousInboundUri(): Promise<string> {
    const tunnel = await this.getMoneroNodeServerTunnel();

    if (!tunnel) return '';

    return tunnel.address;
  }

  public async getAnonymousInboundAddress(): Promise<string> {
    const uri = await this.getAnonymousInboundUri();
    const c = uri.split(':');
    const result = c[0];

    if (!result || result.endsWith('.i2p')) return '';

    return result;
  }

  public async getProcessStats(): Promise<ProcessStats> {
      if (!this.running) {
        throw new Error("Daemon not running");
      }
  
      const getProcessStatsPromise = new Promise<ProcessStats>((resolve, reject) => {
        window.electronAPI.monitorProcess('i2pd',(result) => {
          const { error, stats } = result;
  
          if (error) {
            if (error instanceof Error) reject(error);
            else reject(new Error(`${error}`));
          }
          else if (stats) {
            resolve(stats);
          }
        });
      })
  
  
      return await getProcessStatsPromise;
    }

}

export interface I2pStd {
  readonly out: EventEmitter<string>;
  readonly err: EventEmitter<string>;
};