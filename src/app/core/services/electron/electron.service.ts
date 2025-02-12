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

    window.electronAPI.onBattery((event: any) => {
      console.debug(event);
      this.onBatteryPower.emit()
    });
    window.electronAPI.onAc((event: any) => { 
      console.debug(event);
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
          window.electronAPI.onIsWifiConnectedResponse((event: any, connected: boolean) => {
            console.debug(event);
            window.electronAPI.unregisterOnIsWifiConnectedResponse();
            resolve(connected);
          });
        }
        catch(error: any) {
          reject(new Error(`${error}`));
        }
      });

      window.electronAPI.isWifiConnected();

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
          window.electronAPI.onIsAutoLaunched((event: any, isAutoLaunched: boolean) => {
            console.debug(event);
            window.electronAPI.unregisterOnIsAutoLaunched();
            resolve(isAutoLaunched);
          });
        });
  
        window.electronAPI.isAutoLaunched();
  
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
      window.electronAPI.onIsAutoLaunchEnabled((event: any, enabled: boolean) => {
        window.electronAPI.unregisterOnIsAutoLaunchEnabled();
        resolve(enabled);
      });
    });

    window.electronAPI.isAutoLaunchEnabled();

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
      window.electronAPI.onEnableAutoLaunchError((event: any, error: string) => {
        console.debug(event);
        window.electronAPI.unregisterOnEnableAutoLaunchError();
        window.electronAPI.unregisterOnEnableAutoLaunchSuccess();
        reject(new Error(error));
      });

      window.electronAPI.onEnableAutoLaunchSuccess((event: any) => {
        console.debug(event);
        window.electronAPI.unregisterOnEnableAutoLaunchError();
        window.electronAPI.unregisterOnEnableAutoLaunchSuccess();
        resolve();
      });
    });

    window.electronAPI.enableAutoLaunch(minimized);

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
      window.electronAPI.onDisableAutoLaunchError((event: any, error: string) => {
        console.debug(event);
        window.electronAPI.unregisterOnDisableAutoLaunchError();
        window.electronAPI.unregisterOnDisableAutoLaunchSuccess();
        reject(new Error(error));
      });

      window.electronAPI.onDisableAutoLaunchSuccess((event: any) => {
        console.debug(event);
        window.electronAPI.unregisterOnDisableAutoLaunchError();
        window.electronAPI.unregisterOnDisableAutoLaunchSuccess();
        resolve();
      });
    });

    window.electronAPI.disableAutoLaunch();

    await promise;
  }

  public async isPortable(): Promise<boolean> {
    if (this._isPortable === undefined) {
      const promise = new Promise<boolean>((resolve) => {
        window.electronAPI.onIsPortable((event: any, value: boolean) => {
          window.electronAPI.unregisterIsPortable();
          resolve(value);
        });
      });
  
      window.electronAPI.isPortable();
  
      this._isPortable = await promise;
    }

    return this._isPortable;
  }

  public async selectFile(extensions?: string[]): Promise<string> {
  
    const selectPromise: Promise<string> = new Promise<string>((resolve) => {
      window.electronAPI.onSelectedFile((event: any, path: string) => {
        window.electronAPI.unregisterOnSelectedFile();
        resolve(path);
      });
    });

    window.electronAPI.selectFile(extensions);
    
    return await selectPromise;
  }

  public async readFile(filePath: string): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
      window.electronAPI.onReadFileError((event: any, error: string) => {
        window.electronAPI.unregisterOnReadFile();
        reject(new Error(error));
      });

      window.electronAPI.onReadFile((event: any, data: string) => {
        window.electronAPI.unregisterOnReadFile();
        resolve(data);
      });
    });

    window.electronAPI.readFile(filePath);

    return await promise;
  }

  public async saveFile(defaultPath: string, content: string): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
      window.electronAPI.onSaveFileError((event: any, error: string) => {
        window.electronAPI.unregisterOnSaveFile();
        reject(new Error(error));
      });

      window.electronAPI.onSaveFile((event: any, filePath: string) => {
        window.electronAPI.unregisterOnSaveFile();
        resolve(filePath);
      })
    });

    window.electronAPI.saveFile(defaultPath, content);

    return await promise;
  }

  public async selectFolder(): Promise<string> {
    const selectPromise = new Promise<string>((resolve) => {
      window.electronAPI.onSelectedFolder((event: any, folder: string) => {
        window.electronAPI.unregisterOnSelectedFolder();
        resolve(folder);
      });
    });

    window.electronAPI.selectFolder();
    
    return await selectPromise;
  }

  public async getPath(path: 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps'): Promise<string> {
    const promise = new Promise<string>((resolve) => {
      window.electronAPI.onGetPath((event: any, result: string) => {
        window.electronAPI.unregisterOnGetPath();
        resolve(result);
      })
    });

    window.electronAPI.getPath(path);

    return await promise;
  }

  public async getOsType(): Promise<{ platform: string, arch: string }> {
    const promise = new Promise<{ platform: string, arch: string }>((resolve) => {
      window.electronAPI.gotOsType((event: any, osType: { platform: string; arch: string; }) => {
        window.electronAPI.unregisterGotOsType();
        resolve(osType);
      });
    });

    window.electronAPI.getOsType();

    return await promise;
  }

  public async downloadFile(url: string, destination: string, progressFunction?: (info: { progress: number, status: string }) => void): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
      if (progressFunction) {
        window.electronAPI.onDownloadProgress((event: any, prog: { progress: number, status: string }) => progressFunction(prog));
      }

      window.electronAPI.onDownloadFileError((event: any, error: string) => {
        window.electronAPI.unregisterOnDownloadFile();
        reject(new Error(error));
      });

      window.electronAPI.onDownloadFileComplete((event: any, fileName: string) => {
        window.electronAPI.unregisterOnDownloadFile();
        resolve(fileName);
      });
    });

    window.electronAPI.downloadFile(url, destination);
    return await promise;
  }

}
