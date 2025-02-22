import { execSync } from "child_process";
import { AppChildProcess } from "./AppChildProcess";
import * as fs from 'fs';
import * as path from 'path';
import { InstallationInfo } from "./InstallationInfo";


export interface TorInstallationInfo extends InstallationInfo { configFile?: string; isRunning?: boolean; };

export class TorProcess extends AppChildProcess {

  private static get defaultDataDirectory(): string {
    return path.join(this.userDataPath, 'tor', 'data');
  }

  private static get defaultConfigPath(): string {
    return path.join(this.userDataPath, 'tor', 'config', 'torrc');
  }

  private static get defaultHiddenServiceDir(): string {
    return path.join(this.userDataPath, 'tor', 'hidden_services', 'monero');
  }

  private static get defaultHostnamePath(): string {
    return path.join(this.userDataPath, 'tor', 'hidden_services', 'monero', 'hostname');
  }


  private static get defaultFlags(): string[] {
    const flags: string[] = [];

    flags.push('-f', this.defaultConfigPath);

    return flags;
  }

  constructor(path: string, port?: number, rpcPort?: number) {
    TorProcess.createDefaultConfigFile({port, rpcPort});

    super({ command: path, args: TorProcess.defaultFlags, isExe: true });
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
      let lastError: string | null = null;

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
        else if (out.includes('[err]')) {
          lastError = out.replace('[err] ', '');
        }
      };

      const onStdErr = (out: string) => {
        if (!stdOutFound) reject(new Error(out));
      };

      const onClose = (code: number | null) => {
        console.log("TorProcess.start(): Exited with code: " + code);
        if (!stdOutFound) {
          if (!lastError) reject(new Error(`Exited with code ${code}`));
          else reject(new Error(lastError));
        }
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

  public async getHostname(): Promise<string> {
    const filePath = TorProcess.defaultHostnamePath;
    if (!fs.existsSync(filePath)) {
      return "";
    }

    return await new Promise<string>((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err != null) err instanceof Error ? reject(err) : reject(new Error(`${err}`));
        else if (data) resolve(data.replace('\n', ''));
        else reject(new Error("Unknown error"));
      });  
    });
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
    if (fs.existsSync('/etc/tor/torrc')) {
      configFile = '/etc/tor/torrc';
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

  private static createConfigDir(): void {
    if (!fs.existsSync(path.join(this.userDataPath, 'tor'))) {
      fs.mkdirSync(path.join(this.userDataPath, 'tor'));
    }

    if (!fs.existsSync(path.join(this.userDataPath, 'tor', 'hidden_services'))) {
      fs.mkdirSync(path.join(this.userDataPath, 'tor', 'hidden_services'));
    }

    if (!fs.existsSync(path.join(this.userDataPath, 'tor', 'data'))) {
      fs.mkdirSync(path.join(this.userDataPath, 'tor', 'data'));
    }

    if (!fs.existsSync(path.join(this.userDataPath, 'tor', 'config'))) {
      fs.mkdirSync(path.join(this.userDataPath, 'tor', 'config'));
    }

  }
  
  private static createDefaultConfigFile(options: { port?: number, rpcPort?: number }): void {
    this.createConfigDir();
    const { port, rpcPort } = options;
    let content = `DataDirectory ${this.defaultDataDirectory}

## To send all messages to stderr:
Log debug stderr
Log debug stdout
`;
    if (port !== undefined || rpcPort !== undefined) {
      content = `${content}
HiddenServiceDir ${this.defaultHiddenServiceDir}`;
    }

    if (port !== undefined) {
      content = `${content}
HiddenServicePort ${port} 127.0.0.1:${port}    # interface for P2P network`;
    }

    if (rpcPort !== undefined) {
      content = `${content}
HiddenServicePort ${rpcPort} 127.0.0.1:${rpcPort}    # interface for wallet RPC
`;
    }

    fs.writeFileSync(this.defaultConfigPath, content);
  }
  
}
