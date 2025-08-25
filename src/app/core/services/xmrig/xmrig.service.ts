import { EventEmitter, Injectable } from '@angular/core';
import { MiningStatus, XmrigSettings } from '../../../../common';
import { IDBPDatabase, openDB } from 'idb';

type Status = 'running' | 'stopped' | 'starting' | 'restarting' | 'stopping';

export interface XmrigStd {
  readonly out: EventEmitter<string>;
  readonly err: EventEmitter<string>;
};

@Injectable({
  providedIn: 'root'
})
export class XmrigService {
  
  // #region Attributes

  private readonly openDbPromise: Promise<IDBPDatabase>;
  private readonly dbName = 'XmrigSettingsDB';
  private readonly storeName = 'settingsStore';

  private _settings: XmrigSettings = new XmrigSettings();
  private _status: Status = 'stopped';
  private _logs: string[] = [];

  private _lastHashStatus: string = '';
  private _lastHash10s: number = 0;
  private _lastHash60s: number = 0;
  private _lastHash15m: number = 0;

  public miningStatus?: MiningStatus;

  public readonly std: XmrigStd = { out: new EventEmitter<string>(), err: new EventEmitter<string>() };
  public readonly onStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly onStop: EventEmitter<void> = new EventEmitter<void>();

  // #endregion

  // #region Getters

  public get lastHash10s(): number {
    return this._lastHash10s;
  }

  public get lastHash60s(): number {
    return this._lastHash60s;
  }

  public get lastHash15m(): number {
    return this._lastHash15m;
  }

  public get configured(): boolean {
    return this.settings.path !== '';
  }

  public get settings(): XmrigSettings {
    return this._settings;
  }

  public get status(): Status {
    return this._status;
  }

  public get running(): boolean {
    return this._status === 'running';
  }

  public get stopped(): boolean {
    return this._status === 'stopped';
  }

  public get starting(): boolean {
    return this._status === 'starting';
  }

  public get restarting(): boolean {
    return this._status === 'restarting';
  }

  public get stopping(): boolean {
    return this._status === 'stopping';
  }

  // #endregion

  constructor() {
    this.openDbPromise = this.openDatabase();
    this.loadSettings().then(() => console.log('Loaded xmrig settings database')).catch((error: any) => console.error(error));
  }

  // #region Private Methods

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

  private cleanLog(message: string): string {
    return message.replace(/\u001b\[[0-9;]*m/g, '').replace(/[\r\n]+/g, '\n').trim(); // eslint-disable-line
  }

  // #endregion

  // #region Public Methods
  
  public setSettings(config: XmrigSettings): void {
    this._settings = config;
  }

  public async loadSettings(): Promise<XmrigSettings> {
      const db = await this.openDbPromise;
      const result = await db.get(this.storeName, 1);
      
      if (result) {
        this.setSettings(XmrigSettings.parse(result));
      }
      else
      {
        this.setSettings(new XmrigSettings());
      }
  
      return this._settings;
  }

  public async saveSettings(): Promise<void> {
    const db = await this.openDbPromise;
    const settings = this.settings;
    await db.put(this.storeName, { id: 1, ...settings });
  }

  public clearLogs(): void {
    this._logs = [];
  }

  public async refreshMiningStatus(networkDifficulty: number): Promise<void> {
    const _config = this._settings;
    
    await new Promise<void>((resolve, reject) => {
      window.electronAPI.xmrigCmd('h', (result: { error?: string}) => {
        if (result.error) reject(new Error(result.error));
        else resolve();
      });
    });

    const lastHash = this._lastHashStatus;
    const info = lastHash.split('\n')[4]
    if (info) {
      const c = info.split(' ').filter(x => x !== '');
      const hash10s = c[5];
      const hash60s = c[6];
      const hash15m = c[7];

      try {
        this._lastHash10s = parseFloat(hash10s);
        this._lastHash60s = parseFloat(hash60s);
        this._lastHash15m = parseFloat(hash15m);

        if (isNaN(this._lastHash10s)) this._lastHash10s = 0;
        if (isNaN(this._lastHash60s)) this._lastHash60s = 0;
        if (isNaN(this._lastHash15m)) this._lastHash15m = 0;
      } catch (error: any) {
        console.error(error);
        this._lastHash10s = 0;
        this._lastHash60s = 0;
        this._lastHash15m = 0;
      }
    }

    this.miningStatus = new MiningStatus(
      true, 
      _config.user, 
      0, 0, 0, 0.6, 120, 
      networkDifficulty, 0, _config.background, 
      'RandomX', 
      this._lastHash10s, 
      _config.threads, 
      '');
  }

  public async start(config?: XmrigSettings): Promise<void> {
    const _config = config ? config : this._settings;
    if (_config.path === '') throw new Error("Xmrig not configured. Go to Settings -> Mining");
    if (this.running) throw new Error("Already running xmrig");
    if (this.stopping) throw new Error("Xmrig is stopping");
    if (this.starting) throw new Error("Alrady starting xmrig");
    let err: any = null;
    this._status = 'starting';

    try {
      const promise = new Promise<void>((resolve, reject) => {
        
        window.electronAPI.onXmrigOutput(({stdout, stderr} : { stdout?: string, stderr?: string }) => {
          if (stdout) {
            stdout = this.cleanLog(stdout);
            if (stdout.includes("CPU") && stdout.includes("AFFINITY")) {
              this._lastHashStatus = stdout;
            } else {
              this._logs.push(stdout);
              this.std.out.emit(stdout);
            }
          } else if (stderr) {
            stderr = this.cleanLog(stderr);
            this._logs.push(stderr);
            this.std.err.emit(stderr);
          }
        });

        window.electronAPI.onXmrigClose((code: number) => {
          console.log(code);
          this._status = 'stopped';
          this.onStop.emit();
        });

        window.electronAPI.startXmrig(_config.toCommandOptions(), (error?: any) => {
          this._status = error ? 'stopped' : 'running';
          if (error) reject(new Error(`${error}`));
          else resolve();
        });
      });

      await promise;

      this.setSettings(_config);
      this._status = 'running';
      await this.refreshMiningStatus(0);
      this.onStart.emit();
    } catch (error: any) {
      console.error(error);
      err = error;
      this._status = 'stopped';
    }

    if (err) throw err;
  }

  public async stop(): Promise<void> {
    if (this.starting) throw new Error("Xmrig is starting");
    if (!this.running) throw new Error("Already stopped Xmrig");
    if (this.stopping) throw new Error("Alrady stopping Xmrig");
    this._status = 'stopping';
    let err: any = null;

    try {
      const promise = new Promise<void>((resolve, reject) => {
        window.electronAPI.stopXmrig((error?: any) => {
          this._status = 'stopped';
          if (error) reject(new Error(`${error}`));
          else resolve();
        });
      });
    
      console.log("STOPPING Xmrig...");
      
      await promise;
      this.miningStatus = undefined;
      this._status = 'stopped';
      console.log("STOPPED Xmrig...");
    }
    catch (error: any) {
      err = error;
      this._status = 'running';
    }
    
    if (!this.restarting && err === null && this._status === 'stopped') this.onStop.emit();

    if (err) throw err;
  }

  public async restart(): Promise<void> {
    if (this.restarting) throw new Error("Already restarting Xmrig");
    if (this.starting) throw new Error("Xmrig is starting");
    if (this.stopping) throw new Error("Xmrig is stopping");
    if (!this.running) throw new Error("Xmrig is not running");

    this._status = 'restarting';
    let err: any = null;

    try {
      await this.stop();
      await this.start();
    }
    catch(error: any) {
      err = error;
    }

    this._status = 'running';

    if (err) throw err;
  }

  public async isValidPath(path: string): Promise<boolean> {
    return await new Promise<boolean>((resolve) => {
      window.electronAPI.checkValidXmrigPath(path, resolve);
    });
  }

  // #endregion

}
