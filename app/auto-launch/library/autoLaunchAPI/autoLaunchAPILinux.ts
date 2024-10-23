import * as path from 'path';
//import * as untildify from 'untildify';
import * as fileBasedUtilities from '../fileBasedUtilities';
import AutoLaunchAPI from './autoLaunchAPI';
import { AutoLaunchInit } from './autoLaunchInit';

const LINUX_AUTOSTART_DIR = '~/.config/autostart';
const LINUX_DESKTOP = `
[Desktop Entry]
Type=Application
Version=1.0
Name={{APP_NAME}}
Comment={{APP_NAME}} startup script
Exec={{APP_PATH}} {{ARGS}}
StartupNotify=false
Terminal=false
`;

export default class AutoLaunchAPILinux extends AutoLaunchAPI {
  /* Public */

  constructor(init: AutoLaunchInit) {
    super(init);
    this.appPath = this.fixAppPath();
  }

  // Returns a Promise
  public override enable(): Promise<void> {
    const hiddenArg = this.options.launchInBackground;
    const extraArgs = this.options.extraArguments;
    const programArguments = [];

    // Manage arguments
    if (hiddenArg) {
      programArguments.push((hiddenArg !== true) ? hiddenArg : '--hidden');
    }
    if (extraArgs) {
      programArguments.push(extraArgs);
    }
    const args = programArguments.join(' ');

    const desktop = LINUX_DESKTOP.trim()
      .replace(/{{APP_NAME}}/g, this.appName)
      .replace(/{{APP_PATH}}/g, this.appPath)
      .replace(/{{ARGS}}/g, args);

    return fileBasedUtilities.createFile({
      directory: this.getAutostartDirectory(),
      filePath: this.getDesktopFilePath(),
      data: desktop
    });
  }

  // Returns a Promise
  public override disable(): Promise<void> {
    return fileBasedUtilities.removeFile(this.getDesktopFilePath());
  }

  // Returns a Promise which resolves to a {Boolean}
  public override isEnabled(): Promise<boolean> {
    return fileBasedUtilities.fileExists(this.getDesktopFilePath());
  }

  /* Private */

  // Returns a {String}
  private getAutostartDirectory(): string {
    return fileBasedUtilities.untildify(LINUX_AUTOSTART_DIR);
  }

  // Returns a {String}
  private getDesktopFilePath(): string {
    return path.join(this.getAutostartDirectory(), `${this.appName}.desktop`);
  }

  // Returns a {String}
  private fixAppPath(): string {
    let execPath = this.appPath;

    // If this is an AppImage, the actual AppImage's file path must be used, otherwise the mount path will be used.
    // This will fail on the next launch, since AppImages are mount temporarily when executed
    // in an everchanging mount folder.
    if (process.env?.APPIMAGE != null) {
      execPath = process.env.APPIMAGE;
    }

    // As stated in the .desktop entry spec, Exec key's value must be properly escaped with reserved characters.
    execPath = fileBasedUtilities.escapeFilePath(execPath);

    return execPath;
  }
}
