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


/***************************************************************************************************
 * APPLICATION IMPORTS
 */

import 'jquery';
import 'bootstrap-table';
import { NotificationConstructorOptions } from 'electron';

declare global {
  interface Window {
    electronAPI: {
      startMonerod: (options: string[]) => void;
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
      onMonerodStarted: (callback: (event: any, started: boolean) => void) => void;
      getMoneroVersion: (path: string) => void;
      onMoneroVersion: (callback: (event: any, version: string) => void) => void;
      onMoneroVersionError: (callback: (event: any, error: string) => void) => void;
      downloadMonerod: (downloadUrl:string, destination: string) => void;
      onDownloadProgress: (callback: (event: any, progress: { progress: number, status: string }) => void) => void;
      checkValidMonerodPath: (path: string) => void;
      onCheckValidMonerodPath: (callback: (event: any, valid: boolean) => void) => void;
      unsubscribeOnMonerodStarted: () => void;
      onMoneroClose: (callback: (event: any, code: number) => void) => void;
      onMoneroStdout: (callbak: (event: any, out: string) => void) => void;
      isWifiConnected: () => void;
      onIsWifiConnectedResponse: (callback: (event: any, connected: boolean) => void) => void;
      selectFolder: () => void;
      selectFile: (extensions?: string[]) => void;
      onSelectedFolder: (callback: (event: any, path: string) => void) => void;
      onSelectedFile: (callback: (event: any, path: string) => void) => void;
      getOsType: () => void;
      gotOsType: (callback: (event: any, osType: { platform: string, arch: string }) => void) => void;
      showNotification: (options: NotificationConstructorOptions) => void;
      quit: () => void;

      isAppImage: () => void;
      onIsAppImage: (callback: (event: any, value: boolean) => void) => void;

      isAutoLaunchEnabled: () => void;
      onIsAutoLaunchEnabled: (callback: (event: any, enabled: boolean) => void) => void;

      enableAutoLaunch: (minimized: boolean) => void;
      onEnableAutoLaunchError: (callback: (event: any, error: string) => void) => void;
      onEnableAutoLaunchSuccess: (callback: (event: any) => void) => void;
    
      disableAutoLaunch: () => void;
      onDisableAutoLaunchError: (callback: (event: any, error: string) => void) => void;
      onDisableAutoLaunchSuccess: (callback: (event: any) => void) => void;

      isAutoLaunched: () => void;
      onIsAutoLaunched: (callback: (event: any, isAutoLaunched: boolean) => void) => void;
    };
  }
}