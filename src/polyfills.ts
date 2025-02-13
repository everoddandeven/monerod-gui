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

declare global {
  interface Window {
    electronAPI: {
      detectInstallation: (program: 'monerod' | 'i2pd' | 'tor' | 'monerod-gui', callback: (info?: any) => void) => void;
      httpPost: <TConfig extends { [key: string]: any } = object>(params: { id: string; url: string; data?: any; config?: AxiosRequestConfig<TConfig>}, callback: (result: { data?: AxiosResponse<any, any>, code: number; status: string; error?: string; }) => void) => void;
      httpGet: <TConfig extends { [key: string]: any } = object>(params: { id: string; url: string; config?: AxiosRequestConfig<TConfig> }, callback: (result: { data?: AxiosResponse<any, any>, code: number; status: string; error?: string; }) => void) => void;
      startI2pd: (path: string, callback: (error?: any) => void) => void;
      stopI2pd: (callback: (error?: any) => void) => void;
      onI2pdOutput: (callback: (output: {stdout?: string, stderr?: string}) => void) => void;
      copyToClipboard: (content: string) => void;
      startMonerod: (options: string[]) => void;
      stopMonerod: () => void;
      monitorMonerod: () => void;
      onMonitorMonerod: (callback: (event: any, stats: {
        cpu: number;
        memory: number;
        ppid: number;
        pid: number;
        ctime: number;
        elapsed: number;
        timestamp: number;
      }
      ) => void) => void;
      onMonitorMonerodError: (callback: (event: any, error: string) => void) => void;
      unregisterOnMonitorMonerod: () => void,
      unregisterOnMonitorMonerodError: () => void,

      onMonerodStarted: (callback: (event: any, started: boolean) => void) => void;
      getMoneroVersion: (path: string) => void;

      onMoneroVersion: (callback: (event: any, version: string) => void) => void;
      onMoneroVersionError: (callback: (event: any, error: string) => void) => void;
      unregisterOnMoneroVersion: () => void;
      unregisterOnMoneroVersionError: () => void;

      downloadMonerod: (downloadUrl:string, destination: string) => void;
      onDownloadProgress: (callback: (event: any, progress: { progress: number, status: string }) => void) => void;
      checkValidMonerodPath: (path: string) => void;
      onCheckValidMonerodPath: (callback: (event: any, valid: boolean) => void) => void;
      unregisterOnCheckValidMonerodPath: () => void;
      unsubscribeOnMonerodStarted: () => void;
      onMoneroClose: (callback: (event: any, code: number) => void) => void;
      onMoneroStdout: (callbak: (event: any, out: string) => void) => void;
      unregisterOnMoneroStdout: () => void;
      checkValidI2pdPath: (path: string, callback: (valid: boolean) => void) => void;
      isWifiConnected: () => void;
      onIsWifiConnectedResponse: (callback: (event: any, connected: boolean) => void) => void;
      unregisterOnIsWifiConnectedResponse: () => void;
      selectFolder: () => void;
      selectFile: (extensions?: string[]) => void;
      readFile: (filePath: string) => void;
      unregisterOnReadFile: () => void;
      onReadFile: (callback: (event: any, data: string) => void) => void;
      onReadFileError: (callback: (event: any, error: string) => void) => void;
      saveFile: (defaultPath: string, content: string) => void;
      onSaveFile: (callback: (event: any, filePath: string) => void) => void;
      onSaveFileError: (callback: (event: any, error: string) => void) => void;
      unregisterOnSaveFile: () => void;
      onSelectedFolder: (callback: (event: any, path: string) => void) => void;
      onSelectedFile: (callback: (event: any, path: string) => void) => void;
      unregisterOnSelectedFile: () => void;
      unregisterOnSelectedFolder: () => void;

      getPath: (path: 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps') => void;
      onGetPath: (callback: (event: any, path: string) => void) => void;
      unregisterOnGetPath: () => void;

      getOsType: () => void;
      gotOsType: (callback: (event: any, osType: { platform: string, arch: string }) => void) => void;
      unregisterGotOsType: () => void;
      showNotification: (options: NotificationConstructorOptions) => void;
      quit: (callback: (error?: string) => void) => void;

      isPortable: () => void;
      onIsPortable: (callback: (event: any, value: boolean) => void) => void;
      unregisterIsPortable: () => void;

      isAutoLaunchEnabled: () => void;
      onIsAutoLaunchEnabled: (callback: (event: any, enabled: boolean) => void) => void;
      unregisterOnIsAutoLaunchEnabled: () => void;

      enableAutoLaunch: (minimized: boolean) => void;
      onEnableAutoLaunchError: (callback: (event: any, error: string) => void) => void;
      onEnableAutoLaunchSuccess: (callback: (event: any) => void) => void;
      unregisterOnEnableAutoLaunchError: () => void,
      unregisterOnEnableAutoLaunchSuccess: () => void,
    
      disableAutoLaunch: () => void;
      onDisableAutoLaunchError: (callback: (event: any, error: string) => void) => void;
      onDisableAutoLaunchSuccess: (callback: (event: any) => void) => void;
      unregisterOnDisableAutoLaunchError: () => void,
      unregisterOnDisableAutoLaunchSuccess: () => void,

      isAutoLaunched: () => void;
      onIsAutoLaunched: (callback: (event: any, isAutoLaunched: boolean) => void) => void;
      unregisterOnIsAutoLaunched: () => void;

      onTrayStartDaemon: (callback: (event: any) => void) => void;
      onTrayStopDaemon: (callback: (event: any) => void) => void;
      onTrayStartSync: (callback: (event: any) => void) => void;
      onTrayStopSync: (callback: (event: any) => void) => void;
      onTrayQuitDaemon: (callback: (event: any) => void) => void;
      setTrayItemEnabled: (id: string, enabled: boolean) => void;
      setTrayToolTip: (toolTip: string) => void;

      getBatteryLevel: (callback: (level: number) => void) => void;

      isOnBatteryPower: (callback: (onBattery: boolean) => void) => void;
      onBattery: (callback: (event: any) => void) => void;
      onAc: (callback: (event: any) => void) => void;

      downloadFile: (url: string, destination: string) => void;
      onDownloadFileProgress: (callback: (event: any, info: { progress: number, status: string }) => void) => void;
      onDownloadFileError: (callback: (event: any, error: string) => void) => void;
      onDownloadFileComplete: (callback: (event: any, fileName: string) => void) => void;
      unregisterOnDownloadFile: () => void;

      showErrorBox: (title: string, content: string) => void;
    };
  }
}