import * as pathTools from 'path';
import autoLaunchHandler from './library/autoLaunchHandler';
import { AutoLaunchOptions } from './library/autoLaunchAPI/autoLaunchInit';
import AutoLaunchAPI from './library/autoLaunchAPI/autoLaunchAPI';

// Public: The main auto-launch class
export default class AutoLaunch {
  private api: AutoLaunchAPI;
  /* Public */

  // {Object}
  //  :name - {String}
  //  :path - (Optional) {String}
  //  :options - (Optional) {Object}
  //      :launchInBackground, - (Optional) {String}. If set, either use default --hidden arg or specified one.
  //      :mac - (Optional) {Object}
  //          :useLaunchAgent - (Optional) {Boolean}. If `true`, use filed-based Launch Agent. Otherwise use AppleScript
  //           to add Login Item
  //      :extraArgs - (Optional) {Array}
  constructor({ name , path, options }: { name: string, path: string, options: AutoLaunchOptions }) {
    // Name is the only mandatory parameter and must neither be null nor empty
    if (!name) { throw new Error('You must specify a name'); }

    const opts = {
      appName: name,
      options: {
        launchInBackground: (options && (options.launchInBackground != null)) ? options.launchInBackground : false,
        mac: (options && (options.mac != null)) ? options.mac : {},
        extraArguments: (options && (options.extraArguments != null)) ? options.extraArguments : []
      },
      appPath: ''
    };

    const versions = typeof process !== 'undefined' && process !== null ? process.versions : undefined;
    if (path != null) {
      // Verify that the path is absolute or is an AppX path
      if ((!pathTools.isAbsolute(path)) && !process.windowsStore) {
        throw new Error('path must be absolute');
      }
      opts.appPath = path;
    } else if (
      (versions != null)
          && ((versions.nw != null) || (versions['node-webkit'] != null) || (versions.electron != null))) {
      // Autodetecting the appPath from the execPath.
      // This appPath will need to be fixed later depending of the OS used
      // TODO: is this the reason behind issue 92: https://github.com/Teamwork/node-auto-launch/issues/92
      opts.appPath = process.execPath;
    } else {
      throw new Error('You must give a path (this is only auto-detected for NW.js and Electron apps)');
    }

    this.api = autoLaunchHandler(opts);
  }

  public enable(): Promise<void> {
    return this.api.enable();
  }

  public disable(): Promise<void> {
    return this.api.disable();
  }

  // Returns a Promise which resolves to a {Boolean}
  public isEnabled(): Promise<boolean> {
    return this.api.isEnabled();
  }
}
