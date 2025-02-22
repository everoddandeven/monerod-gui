import { execSync } from "child_process";
import { AppChildProcess } from "./AppChildProcess";
import * as fs from 'fs';
import { InstallationInfo } from "./InstallationInfo";


export interface TorInstallationInfo extends InstallationInfo { configFile?: string; isRunning?: boolean; };

export class TorProcess extends AppChildProcess {

  constructor(path: string) {
    super({ command: path, args: [], isExe: true });
  }

  public override async start(): Promise<void> {
    let message: string = "Starting tor process";

    message += `\n\t${this._isExe ? 'Path' : 'Command'}: ${this._command}`;

    if (this._args) {
      message += `\n\tFlags: ${this._args.join(" ")}`
    }

    console.log(message);

    const promise = new Promise<void>((resolve, reject) => {
      let stdOutFound = false;

      const onStdOut = (out: string) => {
        if (stdOutFound) return;
        if (out.includes('Opened Socks listener connection')) {
          stdOutFound = true;
          this.wait(3000).then(resolve);
        }
        else if (out.includes('Is Tor already running?')) {
          stdOutFound = true;
          reject(new Error("Tor is already running"));
        }
      };

      const onStdErr = (out: string) => {
        if (!stdOutFound) reject(new Error(out));
      };

      const onClose = (code: number | null) => {
        if (!stdOutFound) reject(new Error(`Exited with code ${code}`));
      }

      this.onError((err) => onStdErr(err.message));
      this.onStdOut(onStdOut);
      this.onStdErr(onStdErr);
      this.onClose(onClose);
    });

    await super.start();

    await promise;

    console.log(`Started tor process ${this._process?.pid}`);
  }

  static async isValidPath(executablePath: string): Promise<boolean> {
    // Verifica se il file esiste
    if (!fs.existsSync(executablePath)) {
      return false;
    }

    // Verifica se il file è un eseguibile (su Linux)
    try {
      const stats = fs.statSync(executablePath);
      if (!stats.isFile()) {
      return false;
      }

      // Prova a eseguire una versione del comando per ottenere l'output
      const output = execSync(`${executablePath} --version`).toString();
      if (output.includes("Tor version")) {
      return true;
      }
    } catch (err) {
      return false;
    }

    return false;
  }

    public static async detectInstalled(): Promise<TorInstallationInfo | undefined> {
      if (this.isLinux) {
        return await this.detectInstalledLinux();
      }
      else if (this.isWindows) {
        return await this.detectInstalledWindows();
      }
      else if (this.isMacos) {
        return await this.detectInstalledMacos();
      }
      
      return undefined;
    }
  
    private static async detectInstalledLinux(): Promise<TorInstallationInfo | undefined> {
      let path: string | undefined = undefined;
      let configFile: string | undefined = undefined;
      let isRunning: boolean = false;
  
      if (await this.isValidPath('/usr/bin/tor')) {
        path = '/usr/bin/tor';
      }
      if (fs.existsSync('/etc/tor/torrc.conf')) {
        configFile = '/etc/tor/torrc.conf';
      }
  
      if (path) {
        return { path, configFile, isRunning };
      }
  
      return undefined;
    }
  
    private static async detectInstalledWindows(): Promise<TorInstallationInfo | undefined> {
      return undefined;
    }
  
    private static async detectInstalledMacos(): Promise<TorInstallationInfo | undefined> {
      return undefined;
    }
  
}
