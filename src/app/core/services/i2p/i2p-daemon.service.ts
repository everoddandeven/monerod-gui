import { EventEmitter, Injectable } from '@angular/core';
import { I2pDaemonSettings } from '../../../../common';
import { IDBPDatabase, openDB } from 'idb';

@Injectable({
  providedIn: 'root'
})
export class I2pDaemonService {
  private readonly dbName = 'I2PDaemonSettingsDB';
  private readonly storeName = 'settingsStore';
  private readonly openDbPromise: Promise<IDBPDatabase>;

  public readonly onStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly onStop: EventEmitter<void> = new EventEmitter<void>();

  private _settings: I2pDaemonSettings = new I2pDaemonSettings();
  private _running: boolean = false;
  private _starting: boolean = false;
  private _stopping: boolean = false;
  private _restarting: boolean = false;
  private _loaded: boolean = false;
  private _logs: string[] = [];

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

  private detectedInstallation?: { path: string; configFile?: string; tunnelConfig?: string; tunnelsConfigDir?: string; pidFile?: string; isRunning?: boolean; };

  constructor() 
  {
    this.openDbPromise = this.openDatabase();
    this.openDbPromise.then(() => console.log('Loaded i2p settings database')).catch((error: any) => console.error(error));
    this.loadSettings();
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

  public async start(config?: I2pDaemonSettings): Promise<void> {
    const _config = config ? config : this._settings;
    
    if (this.running) throw new Error("Already running i2pd");
    if (this.stopping) throw new Error("i2pd is stopping");
    if (this.starting) throw new Error("Alrady starting i2pd");
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

      window.electronAPI.startI2pd(_config.path, (error?: any) => {
        this._starting = false;
        if (error) reject(new Error(`${error}`));
        else resolve();
      });
    });

    await promise;
    this.setSettings(_config);
    this._running = true;
    this.onStart.emit();
  }
  
  public async stop(): Promise<void> {
    if (this.starting) throw new Error("i2pd is starting");
    if (!this.running) throw new Error("Already stopped i2pd");
    if (this.stopping) throw new Error("Alrady stopping i2pd");
    this._stopping = true;
    
    const promise = new Promise<void>((resolve, reject) => {
      window.electronAPI.stopI2pd((error?: any) => {
        this._stopping = false;
        if (error) reject(new Error(`${error}`));
        else resolve();
      });
    });

    await promise;

    this._running = false;
    if (!this.restarting) this.onStop.emit();
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

    if (!this.detectedInstallation) {
      this.detectedInstallation = await this.detectInstallation();
    }

    if (this._settings.path === '' && this.detectedInstallation) {
      this._settings.path = this.detectedInstallation.path;
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
}

export interface I2pStd {
  readonly out: EventEmitter<string>;
  readonly err: EventEmitter<string>;
};