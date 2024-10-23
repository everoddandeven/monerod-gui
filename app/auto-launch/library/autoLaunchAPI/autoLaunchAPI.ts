import { AutoLaunchInit, AutoLaunchOptions } from "./autoLaunchInit";

export default abstract class AutoLaunchAPI {
  /* Public */

  public appName: string;
  public appPath: string;
  public options: AutoLaunchOptions;

  // init - {Object}
  //   :appName - {String}
  //   :appPath - {String}
  //   :options - {Object}
  //      :launchInBackground - (Optional) {String} If set, either use default --hidden arg or specified one.
  //      :mac - (Optional) {Object}
  //          :useLaunchAgent - (Optional) {Boolean} If `true`, use filed-based Launch Agent. Otherwise use AppleScript
  //           to add Login Item
  //      :extraArguments - (Optional) {Array}
  protected constructor(init: AutoLaunchInit) {
    this.appName = init.appName;
    this.appPath = init.appPath;
    this.options = init.options;
  }

  // Returns a Promise
  public abstract enable(): Promise<void>;

  // Returns a Promise
  public abstract disable(): Promise<void>;

  // Returns a Promise which resolves to a {Boolean}
  public abstract isEnabled(): Promise<boolean>;
}
