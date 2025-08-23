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

  public miningStatus?: MiningStatus;

  public readonly std: XmrigStd = { out: new EventEmitter<string>(), err: new EventEmitter<string>() };
  public readonly onStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly onStop: EventEmitter<void> = new EventEmitter<void>();

  // #endregion

  // #region Getters

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

  public async refreshMiningStatus(): Promise<void> {
    const _config = this._settings;
    this.miningStatus = new MiningStatus(true, _config.user, 0, 0, 0, 0.6, 120, 0, 0, false, 'RandomX', 0, _config.threads, '');
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
            this._logs.push(stdout);
            this.std.out.emit(stdout);
          } else if (stderr) {
            this._logs.push(stderr);
            this.std.err.emit(stderr);
            //this._status = 'stopped';
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
      await this.refreshMiningStatus();
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
