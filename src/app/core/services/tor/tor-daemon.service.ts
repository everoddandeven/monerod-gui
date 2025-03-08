import { EventEmitter, Injectable } from '@angular/core';
import { ProcessStats, TorDaemonSettings } from '../../../../common';
import { IDBPDatabase, openDB } from 'idb';
import { ElectronService } from '../electron/electron.service';

@Injectable({
  providedIn: 'root'
})
export class TorDaemonService {
  private readonly versionApiUrl: string = 'https://gitlab.torproject.org/api/v4/projects/426/repository/tags';
  private _detectedInstallation?: { path: string; configFile?: string; tunnelConfig?: string; tunnelsConfigDir?: string; pidFile?: string; isRunning?: boolean; };
  private readonly dbName = 'TorDaemonSettingsDB';
  private readonly storeName = 'settingsStore';
  private readonly openDbPromise: Promise<IDBPDatabase>;
  private _anonymousInbound: string = '';

  public get anonymousInbound(): string {
    return this._anonymousInbound;
  }
  
  public readonly onStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly onStop: EventEmitter<void> = new EventEmitter<void>();
  public readonly std: TorStd = { out: new EventEmitter<string>(), err: new EventEmitter<string>() };
  public readonly proxy: string = '127.0.0.1:9050';
  public readonly txProxy: string = 'tor,127.0.0.1:9050,disable_noise';

  private _settings: TorDaemonSettings = new TorDaemonSettings();
  private _running: boolean = false;
  private _starting: boolean = false;
  private _stopping: boolean = false;
  private _restarting: boolean = false;
  private _loaded: boolean = false;
  private _logs: string[] = [];
  private _reloading: boolean = false;
  private _changingIdentity: boolean = false;

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

  public get settings(): TorDaemonSettings {
    return this._settings;
  }

  public get loaded(): boolean {
    return this._loaded;
  }

  public get reloading(): boolean {
    return this._reloading;
  }

  public get changingIdentity(): boolean {
    return this._changingIdentity;
  }
  
  constructor(private electronService: ElectronService) {
    this.openDbPromise = this.openDatabase();
    this.loadSettings().then(() => console.log('Loaded tor settings database')).catch((error: any) => console.error(error));
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

  private async detectInstallation(): Promise<{ path: string; configFile?: string; tunnelConfig?: string; tunnelsConfigDir?: string; pidFile?: string; isRunning?: boolean; } | undefined> {
    return await new Promise<{ path: string; } | undefined>((resolve) => {
      window.electronAPI.detectInstallation('tor', resolve);
    });
  }
  
  public async isValidPath(path: string): Promise<boolean> {
    return await new Promise<boolean>((resolve) => {
      window.electronAPI.checkValidTorPath(path, resolve);
    });
  }

  public async start(config?: TorDaemonSettings): Promise<void> {
    const _config = config ? config : this._settings;
    
    if (this.running) throw new Error("Already running tor");
    if (this.stopping) throw new Error("tor is stopping");
    if (this.starting) throw new Error("Alrady starting tor");

    this._starting = true;
    const promise = new Promise<void>((resolve, reject) => {
      
      window.electronAPI.onTorOutput(({stdout, stderr} : { stdout?: string, stderr?: string }) => {
        if (stdout) {
          this._logs.push(stdout);
          this.std.out.emit(stdout);
        } else if (stderr) {
          this._logs.push(stderr);
          this.std.err.emit(stderr);
        }
      });

      window.electronAPI.onTorClose((code: number) => {
        if (code !== 0) console.warn(`Tor exited with code ${code}`);
        this._running = false;
        this.onStop.emit();
      });

      window.electronAPI.startTor(_config, (error?: any) => {
        this._starting = false;
        if (error) reject(new Error(`${error}`));
        else resolve();
      });
    });

    await promise;

    this.setSettings(_config);
    this._anonymousInbound = await this.getAnonymousInbound();
    this._running = true;
    this.onStart.emit();
  }

  public async stop(): Promise<void> {
    if (this.starting) throw new Error("tor is starting");
    if (!this.running) throw new Error("Already stopped tor");
    if (this.stopping) throw new Error("Alrady stopping tor");
    this._stopping = true;
    let err: any = null;

    try {
      const promise = new Promise<void>((resolve, reject) => {
        window.electronAPI.stopTor((error?: any) => {
          this._stopping = false;
          if (error) reject(new Error(`${error}`));
          else resolve();
        });
      });
  
      await promise;
    }
    catch (error: any) {
      err = error;
      this._stopping = false;
    }

    this._running = false;
    if (!this.restarting) this.onStop.emit();

    if (err) throw err;
  }

  public async restart(): Promise<void> {
    if (this.restarting) throw new Error("Already restarting tor");
    if (this.starting) throw new Error("tor is starting");
    if (this.stopping) throw new Error("tor is stopping");
    if (!this.running) throw new Error("tor is not running");

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

  public clearLogs(): void {
    this._logs = [];
  }

  public setSettings(config: TorDaemonSettings): void {
    this._settings = config;
  }

  public async setPath(path: string, save: boolean = false, restart: boolean = false): Promise<void> {
    if (!await this.isValidPath(path)) throw new Error("Invalid tor path: " + path);

    this._settings.path = path;

    if (save) 
    {
      await this.saveSettings();
    }

    if (this.running && restart) {
      await this.restart();
    }
  }

  public async loadSettings(): Promise<TorDaemonSettings> {
    const db = await this.openDbPromise;
    const result = await db.get(this.storeName, 1);
    
    if (result) {
      this.setSettings(TorDaemonSettings.parse(result));
    }
    else
    {
      this.setSettings(new TorDaemonSettings());
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

  private async getHostname(): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      window.electronAPI.getTorHostname((result: { hostname?: string; error?: string; }) => {
        const { error, hostname } = result;

        if (error) reject(new Error(error));
        else if (hostname) resolve(hostname);
        else reject(new Error("Unknown error"));
      });
    });
  }

  public async getAnonymousInbound(): Promise<string> {
    try {
      const address = await this.getHostname();
      const { port } = this.settings;
  
      return `${address},127.0.0.1:${port}`;
    }
    catch (error: any) {
      console.error(error);
      return '';
    }
  }

  public async getVersion(): Promise<string> {
    const settings = this.loaded ? this.settings : await this.loadSettings();
    if (settings.path === '') throw new Error("Tor not configured");
    return await new Promise<string>((resolve, reject) => {
      window.electronAPI.getTorVersion(settings.path, (result: { version?: string; error?: string; }) => {
        const { version, error } = result;

        if (error) reject(new Error(error));
        else if (version) resolve(version);
        else reject(new Error("Unkown error"));
      })
    });
  }

  public async getLatestVersion(): Promise<string> {
    const tags: any[] = (await this.electronService.get(this.versionApiUrl)) as any[];
    
    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error("No tor versions found");  
    }
    
    const latestVersion = tags[0].name as string; // Il primo tag dovrebbe essere il più recente
    return latestVersion;
  }

  public async authenticate(): Promise<boolean> {
    return await new Promise<boolean>((resolve, reject) => {
      window.electronAPI.invokeTorControlCommand('authenticate', (res: { result?: any; error?: string; }) => {
        const { error, result } = res;

        if (error) reject(new Error(error));
        else if (result) resolve(result);
        else reject(new Error("Unknown error"));
      });
    });
  }

  public async getCircuitStatus(): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      window.electronAPI.invokeTorControlCommand('getCircuitStatus', (res: { result?: any; error?: string; }) => {
        const { error, result } = res;

        if (error) reject(new Error(error));
        else if (result) resolve(result);
        else reject(new Error("Unknown error"));
      });
    });
  }

  public async getCircuitEstablished(): Promise<boolean> {
    return await new Promise<boolean>((resolve) => {
      window.electronAPI.invokeTorControlCommand('getCircuitEstablished', (res: { result?: any; error?: string; }) => {
        const { error, result } = res;

        if (error) resolve(false);
        else if (result && typeof result === 'string') {
          try {
            const v = result.split('=');
          
            if (v.length !== 2) throw new Error("Could not parse result");

            const value = v[1];

            resolve(value === '1');
          }
          catch (error: any) {
            console.error(error);
            //reject(error instanceof Error ? error : new Error(`${error}`));
            resolve(false);
          }
        }
        else resolve(false);
      });
    });
  }

  public async getBootstrapPhase(): Promise<TorBootstrapPhase> {
    return await new Promise<TorBootstrapPhase>((resolve, reject) => {
      window.electronAPI.invokeTorControlCommand('getBootstrapPhase', (res: { result?: any; error?: string; }) => {
        const { error, result } = res;

        if (error) reject(new Error(error));
        else if (result) resolve(TorBootstrapPhase.parse(result));
        else reject(new Error("Unknown error"));
      });
    });
  }

  public async getNetworkStatus(): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      window.electronAPI.invokeTorControlCommand('getNetworkStatus', (res: { result?: any; error?: string; }) => {
        const { error, result } = res;

        if (error) reject(new Error(error));
        else if (result) resolve(result);
        else reject(new Error("Unknown error"));
      });
    });
  }

  public async changeIdentity(): Promise<string> {
    if (this.changingIdentity) throw new Error('Already changing identity');

    this._changingIdentity = true;

    try {
      const result = await new Promise<string>((resolve, reject) => {
        window.electronAPI.invokeTorControlCommand('changeIdentity', (res: { result?: any; error?: string; }) => {
          const { error, result } = res;
  
          if (error) reject(new Error(error));
          else if (result) resolve(result);
          else reject(new Error("Unknown error"));
        });
      });

      this._changingIdentity = false;

      return result;
    }
    catch (error: any) {
      const err = error instanceof Error ? error : new Error(`${error}`);

      this._changingIdentity = false;

      throw err;
    }
  }

  public async getUptime(): Promise<number> {
    return await new Promise<number>((resolve, reject) => {
      window.electronAPI.invokeTorControlCommand('getUptime', (res: { result?: any; error?: string; }) => {
        const { error, result } = res;
        if (error) reject(new Error(error));
        else if (result && typeof result === 'string') {
          try {
            const v = result.split('=');

            if (v.length !== 2) throw new Error("Could not parse uptime");

            const value = parseInt(v[1]);

            resolve(value);
          }
          catch(error: any) { reject(error instanceof Error ? error : new Error(`${error}`)); }          
        }
        else reject(new Error("Unknown error"));
      });
    });
  }

  public async getTrafficInfo(): Promise<TorTrafficInfo> {
    return await new Promise<TorTrafficInfo>((resolve, reject) => {
      window.electronAPI.invokeTorControlCommand('getTrafficInfo', (res: { result?: TorTrafficInfo; error?: string; }) => {
        const { error, result } = res;

        if (error) reject(new Error(error));
        else if (result) resolve(result);
        else reject(new Error("Unknown error"));
      });
    });
  }

  public async reload(): Promise<string> {
    if (this.reloading) throw new Error("Already realoading tor service");

    this._reloading = true;
    let err: Error | null = null;

    try {
      const result =  await new Promise<string>((resolve, reject) => {
        window.electronAPI.invokeTorControlCommand('reload', (res: { result?: any; error?: string; }) => {
          const { error, result } = res;
  
          if (error) reject(new Error(error));
          else if (result) resolve(result);
          else reject(new Error("Unknown error"));
        });
      });

      this._reloading = false;

      return result;
    }
    catch (error: any) {
      err = error instanceof Error ? error : new Error(`${error}`);
      this._reloading = false;
      throw err;
    }
  }

  public async clearDnsCache(): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      window.electronAPI.invokeTorControlCommand('clearDnsCache', (res: { result?: any; error?: string; }) => {
        const { error, result } = res;

        if (error) reject(new Error(error));
        else if (result) resolve(result);
        else reject(new Error("Unknown error"));
      });
    });
  }

  public async shutdown(): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      window.electronAPI.invokeTorControlCommand('shutdown', (res: { result?: any; error?: string; }) => {
        const { error, result } = res;

        if (error) reject(new Error(error));
        else if (result) resolve(result);
        else reject(new Error("Unknown error"));
      });
    });
  }

  public async getProcessStats(): Promise<ProcessStats> {
    if (!this.running) {
      throw new Error("Daemon not running");
    }

    const getProcessStatsPromise = new Promise<ProcessStats>((resolve, reject) => {
      window.electronAPI.monitorProcess('tor',(result) => {
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

interface TorStd {
  out: EventEmitter<string>;
  err: EventEmitter<string>;
};

export class TorBootstrapPhase {
  public level: 'NOTICE' | 'WARN' | 'ERROR';
  public progress?: number;
  public summary?: string;

  constructor(l: 'NOTICE' | 'WARN' | 'ERROR', p?: number, s?: string) {
    this.level = l;
    this.progress = p;
    this.summary = s;
  }

  public static parse(value: string): TorBootstrapPhase {
    if (!value.startsWith('status/bootstrap-phase=')) throw new Error("Invalid value provided: " + value);

    const v = value.split(" ");
    const l = v[0].split("=")[1] as 'NOTICE' | 'WARN' | 'ERROR';

    const fp = v.find((c) => c.startsWith("PROGRESS="));
    let p: number | undefined;

    if (fp) p = Number(fp.split("=")[1]);

    const fs = v.find((c) => c.startsWith("SUMMARY="));
    let s: string | undefined;
    if (fs) s = fs.split("=")[1];

    const phase = new TorBootstrapPhase(l, p, s);

    return phase;
  }
}

export interface TorTrafficInfo { sent: number; received: number; };