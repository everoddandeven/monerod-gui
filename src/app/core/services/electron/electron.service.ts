import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer!: typeof ipcRenderer;
  webFrame!: typeof webFrame;
  childProcess!: typeof childProcess;
  fs!: typeof fs;

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = (window as any).require('electron').ipcRenderer;
      this.webFrame = (window as any).require('electron').webFrame;

      this.fs = (window as any).require('fs');

      this.childProcess = (window as any).require('child_process');
      this.childProcess.exec('node -v', (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout:\n${stdout}`);
      });

      // Notes :
      // * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  public async isAutoLaunchEnabled(): Promise<boolean> {
    if (await this.isAppImage()) {
      return false;
    }

    const promise = new Promise<boolean>((resolve) => {
      window.electronAPI.onIsAutoLaunchEnabled((event: any, enabled: boolean) => {
        resolve(enabled);
      });
    });

    window.electronAPI.isAutoLaunchEnabled();

    return await promise;
  }

  public async enableAutoLaunch(): Promise<void> {
    if (await this.isAppImage()) {
      throw new Error("Cannot enable auto launch");
    }

    const enabled = await this.isAutoLaunchEnabled();

    if (enabled) {
      throw new Error("Auto launch already enabled");
    }

    const promise = new Promise<void>((resolve, reject) => {
      window.electronAPI.onEnableAutoLaunchError((event: any, error: string) => {
        console.debug(event);
        reject(error);
      });

      window.electronAPI.onEnableAutoLaunchSuccess((event: any) => {
        console.debug(event);
        resolve();
      });
    });

    window.electronAPI.enableAutoLaunch();

    await promise;
  }


  public async disableAutoLaunch(): Promise<void> {
    if (await this.isAppImage()) {
      throw new Error("Cannot disable auto launch");
    }

    const enabled = await this.isAutoLaunchEnabled();

    if (!enabled) {
      throw new Error("Auto launch already disabled");
    }

    const promise = new Promise<void>((resolve, reject) => {
      window.electronAPI.onDisableAutoLaunchError((event: any, error: string) => {
        console.debug(event);
        reject(error);
      });

      window.electronAPI.onDisableAutoLaunchSuccess((event: any) => {
        console.debug(event);
        resolve();
      });
    });

    window.electronAPI.disableAutoLaunch();

    await promise;
  }

  public async isAppImage(): Promise<boolean> {
    const promise = new Promise<boolean>((resolve) => {
      window.electronAPI.onIsAppImage((event: any, value: boolean) => {
        resolve(value);
      });
    });

    window.electronAPI.isAppImage();

    return await promise;
  }

}
