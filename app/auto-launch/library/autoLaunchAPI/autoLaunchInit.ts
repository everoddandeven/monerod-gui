
  // init - {Object}
  //   :appName - {String}
  //   :appPath - {String}
  //   :options - {Object}
  //      :launchInBackground - (Optional) {String} If set, either use default --hidden arg or specified one.
  //      :mac - (Optional) {Object}
  //          :useLaunchAgent - (Optional) {Boolean} If `true`, use filed-based Launch Agent. Otherwise use AppleScript
  //           to add Login Item
  //      :extraArguments - (Optional) {Array}

export interface AutoLaunchInit {
  appName: string;
  appPath: string;
  options: AutoLaunchOptions;
}

export interface AutoLaunchOptions {
  launchInBackground?: string | boolean;
  mac?: {
    useLaunchAgent?: boolean;
  },
  linux?: {
    version?: string;
    comment?: string;
  },
  extraArguments?: string[];
}
