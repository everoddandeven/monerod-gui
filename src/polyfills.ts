/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes Safari >= 10, Chrome >= 55 (including Opera),
 * Edge >= 13 on the desktop, and iOS 10 and Chrome on mobile.
 *
 * Learn more in https://angular.io/guide/browser-support
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/**
 * By default, zone.js will patch all possible macroTask and DomEvents
 * user can disable parts of macroTask/DomEvents patch by setting following flags
 * because those flags need to be set before `zone.js` being loaded, and webpack
 * will put import in the top of bundle, so user need to create a separate file
 * in this directory (for example: zone-flags.ts), and put the following flags
 * into that file, and then add the following code before importing zone.js.
 * import './zone-flags.ts';
 *
 * The flags allowed in zone-flags.ts are listed here.
 *
 * The following flags will work for all browsers.
 *
 * (window as any).__Zone_disable_requestAnimationFrame = true; // disable patch requestAnimationFrame
 * (window as any).__Zone_disable_on_property = true; // disable patch onProperty such as onclick
 * (window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove']; // disable patch specified eventNames
 *
 *  in IE/Edge developer tools, the addEventListener will also be wrapped by zone.js
 *  with the following flag, it will bypass `zone.js` patch for IE/Edge
 *
 *  (window as any).__Zone_enable_cross_context_check = true;
 *
 */

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js';  // Included with Angular CLI.
import { AxiosRequestConfig, AxiosResponse } from 'axios';


/***************************************************************************************************
 * APPLICATION IMPORTS
 */

import { NotificationConstructorOptions } from 'electron';

interface ProcessInfo {
  cpu: number;
  memory: number;
  ppid: number;
  pid: number;
  ctime: number;
  elapsed: number;
  timestamp: number;
};

declare global {
  interface Window {
    electronAPI: {
      detectInstallation: (program: 'monerod' | 'i2pd' | 'tor' | 'monerod-gui', callback: (info?: any) => void) => void;
      httpPost: <TConfig extends { [key: string]: any } = object>(params: { id: string; url: string; data?: any; config?: AxiosRequestConfig<TConfig>}, callback: (result: { data?: AxiosResponse<any, any>, code: number; status: string; error?: string; }) => void) => void;
      httpGet: <TConfig extends { [key: string]: any } = object>(params: { id: string; url: string; config?: AxiosRequestConfig<TConfig> }, callback: (result: { data?: AxiosResponse<any, any>, code: number; status: string; error?: string; }) => void) => void;
      copyToClipboard: (content: string) => void;
      
      startMonerod: (options: string[], callback: (result: {error?: any}) => void) => void;
      stopMonerod: (callback: (result: { error?: string; code?: number; }) => void) => void;
      monitorMonerod: (callback: (result: {stats?: ProcessInfo, error?: any}) => void) => void;
      getMonerodVersion: (path: string, callback: (result: { version?: string; error?: string; }) => void) => void;
      downloadMonerod: (downloadUrl:string, destination: string, progress: (info: { progress: number, status: string }) => void, complete: (path: string) => void, error: (err: string) => void) => void;
      checkValidMonerodPath: (path: string, callback: (valid: boolean) => void) => void;
      onMonerodClose: (callback: (code: number) => void) => void;
      onMonerodStdout: (callbak: (out: string) => void) => void;
      unregisterOnMoneroStdout: () => void;

      startI2pd: (path: string, port: number, rpcPort: number, callback: (error?: any) => void) => void;
      stopI2pd: (callback: (error?: any) => void) => void;
      onI2pdOutput: (callback: (output: {stdout?: string, stderr?: string}) => void) => void;
      checkValidI2pdPath: (path: string, callback: (valid: boolean) => void) => void;
      
      isWifiConnected: (callback: (connected: boolean) => void) => void;

      selectFolder: (callback: (path: string) => void) => void;
      selectFile: (extensions: string[], callback: (path: string) => void) => void;

      readFile: (filePath: string, callback: (result: { data?: string; error?: string; }) => void) => void;
      saveFile: (defaultPath: string, content: string, callback: (result: { path?: string; error?: string; }) => void) => void;

      getPath: (path: 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps', callback: (path: string) => void) => void;
      getOsType: (callback: (event: { osType?: { platform: string, arch: string }; error?: string;}) => void) => void;

      showNotification: (options: NotificationConstructorOptions) => void;
      quit: (callback: (error?: string) => void) => void;

      isPortable: (callback: (value: boolean) => void) => void;

      isAutoLaunchEnabled: (callback: (enabled: boolean) => void) => void;
      enableAutoLaunch: (minimized: boolean, callback: (result: { error?: string; }) => void) => void;
      disableAutoLaunch: (callback: (result: { error?: string; }) => void) => void;
      isAutoLaunched: (callback: (isAutoLaunched: boolean) => void) => void;

      onTrayStartDaemon: (callback: (event: any) => void) => void;
      onTrayStopDaemon: (callback: (event: any) => void) => void;
      onTrayStartSync: (callback: (event: any) => void) => void;
      onTrayStopSync: (callback: (event: any) => void) => void;
      onTrayQuitDaemon: (callback: (event: any) => void) => void;
      setTrayItemEnabled: (id: string, enabled: boolean) => void;
      setTrayToolTip: (toolTip: string) => void;

      getBatteryLevel: (callback: (level: number) => void) => void
      isOnBatteryPower: (callback: (onBattery: boolean) => void) => void;
      onBattery: (callback: () => void) => void;
      onAc: (callback: () => void) => void;

      downloadFile: (
        url: string, 
        destination: string,
        progress: (info: { progress: number, status: string }) => void, 
        complete: (fileName: string) => void,
        error: (error: string) => void
      ) => void;
      
      showErrorBox: (title: string, content: string) => void;
    };
  }
}
