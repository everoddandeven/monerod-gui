import { EventEmitter, Injectable, NgZone } from '@angular/core';
// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { APP_CONFIG } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  childProcess!: typeof childProcess;
  fs!: typeof fs;

  private _isPortable?: boolean;
  private _isAutoLaunched?: boolean;
  private _online: boolean = false;
  private _isProduction: boolean = false;

  public readonly onAcPower: EventEmitter<void> = new EventEmitter<void>();
  public readonly onBatteryPower: EventEmitter<void> = new EventEmitter<void>();

  public get isProduction(): boolean {
    return this._isProduction;
  }

  constructor(private ngZone: NgZone) {
    this._online = navigator.onLine;
    window.addEventListener('online', () => this._online = true);
    window.addEventListener('offline', () => this._online = false);
    this._isProduction = APP_CONFIG.production;

    window.electronAPI.onBattery(() => {
      this.onBatteryPower.emit()
    });
    window.electronAPI.onAc(() => { 
      this.onAcPower.emit()
    });
  }

  public get online(): boolean {
    return this._online;
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  public async isWifiConnected(): Promise<boolean> {
    try {
      const promise = new Promise<boolean>((resolve, reject) => {
        try {
          window.electronAPI.isWifiConnected((connected: boolean) => {
            resolve(connected);
          });
        }
        catch(error: any) {
          reject(new Error(`${error}`));
        }
      });

      return await promise;
    }
    catch(error: any) {
      console.error(error);
    }

    return false;
  }

  public async isOnBatteryPower(): Promise<boolean> {
    const promise = new Promise<boolean>((resolve) => {
      window.electronAPI.isOnBatteryPower((onBattery: boolean) => {
        this.ngZone.run(() => {        
          resolve(onBattery);
        });
      });
    });

    return await promise;
  }

  public async getBatteryLevel(): Promise<number> {
    const promise = new Promise<number>((resolve) => {
      window.electronAPI.getBatteryLevel((level: number) => {
        resolve(level);
      });
    });

    return (await promise)*100;
  }

  public async isAutoLaunched(): Promise<boolean> {
    if (this._isAutoLaunched === undefined) {
      try {
        const promise = new Promise<boolean>((resolve) => {
          window.electronAPI.isAutoLaunchEnabled((isAutoLaunched: boolean) => {
            resolve(isAutoLaunched);
          });
        });
    
        this._isAutoLaunched = await promise;
      } catch(error: any) {
        console.error(error);
        this._isAutoLaunched = false;
      }
    }

    return this._isAutoLaunched;
  }

  public async isAutoLaunchEnabled(): Promise<boolean> {
    if (await this.isPortable()) {
      return false;
    }

    const promise = new Promise<boolean>((resolve) => {
      window.electronAPI.isAutoLaunchEnabled((enabled: boolean) => {
        resolve(enabled);
      });
    });

    return await promise;
  }

  public async enableAutoLaunch(minimized: boolean): Promise<void> {
    if (await this.isPortable()) {
      throw new Error("Cannot enable auto launch");
    }

    const enabled = await this.isAutoLaunchEnabled();

    if (enabled) {
      throw new Error("Auto launch already enabled");
    }

    const promise = new Promise<void>((resolve, reject) => {
      window.electronAPI.enableAutoLaunch(minimized, (result: { error?: string; }) => {
        const { error } = result;

        if (error) reject(new Error(error));
        else resolve();
      });
    });

    await promise;
  }


  public async disableAutoLaunch(): Promise<void> {
    if (await this.isPortable()) {
      throw new Error("Cannot disable auto launch");
    }

    const enabled = await this.isAutoLaunchEnabled();

    if (!enabled) {
      throw new Error("Auto launch already disabled");
    }

    const promise = new Promise<void>((resolve, reject) => {
      window.electronAPI.disableAutoLaunch((result: { error?: string} ) => {
        const { error } = result;

        if (error) reject(new Error(error));
        else resolve();
      });
    });

    await promise;
  }

  public async isPortable(): Promise<boolean> {
    if (this._isPortable === undefined) {
      const promise = new Promise<boolean>((resolve) => {
        window.electronAPI.isPortable((value: boolean) => {
          resolve(value);
        });
      });
    
      this._isPortable = await promise;
    }

    return this._isPortable;
  }

  public async selectFile(extensions?: string[]): Promise<string> {
  
    const selectPromise: Promise<string> = new Promise<string>((resolve) => {
      window.electronAPI.selectFile(extensions ? extensions : [], (path: string) => {
        resolve(path);
      });
    });
    
    return await selectPromise;
  }

  public async readFile(filePath: string): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
      window.electronAPI.readFile(filePath, (result: { data?: string; error?: string; }) => {
        const { data, error } = result;

        if (error) reject(new Error(error));
        else if (data) resolve(data);
        else reject(new Error("Cannot read file"));
      });
    });

    return await promise;
  }

  public async saveFile(defaultPath: string, content: string): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
      window.electronAPI.saveFile(defaultPath, content, (result: { path?: string; error?: string }) => {
        const { path, error } = result;

        if (error) reject(new Error(error));
        else if (path) resolve(path);
        else reject(new Error("Could not save file"));
      });

    });

    return await promise;
  }

  public async selectFolder(): Promise<string> {
    const selectPromise = new Promise<string>((resolve) => {
      window.electronAPI.selectFolder((folder: string) => {
        resolve(folder);
      });
    });
    
    return await selectPromise;
  }

  public async getPath(path: 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps'): Promise<string> {
    const promise = new Promise<string>((resolve) => {
      window.electronAPI.getPath(path, (result: string) => {
        resolve(result);
      })
    });

    return await promise;
  }

  private _osType?: { platform: string; arch: string; };

  public async getOsType(): Promise<{ platform: string, arch: string }> {
    if (this._osType) return this._osType;

    const promise = new Promise<{ platform: string, arch: string }>((resolve, reject) => {
      window.electronAPI.getOsType((result: { osType?: { platform: string; arch: string; }; error?: string;}) => {
        const { error, osType } = result;

        if (error) reject(new Error(error));
        else if (osType) resolve(osType);
        else reject(new Error("Could not get os type"))

      });
    });

    this._osType = await promise;

    return this._osType;
  }

  public async downloadFile(url: string, destination: string, progressFunction?: (info: { progress: number, status: string }) => void): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
      window.electronAPI.downloadFile(url, destination, progressFunction ? progressFunction : (info) => console.log(info), (fileName: string) => resolve(fileName), (error: string) => reject(new Error(error)));
    });

    return await promise;
  }

}
