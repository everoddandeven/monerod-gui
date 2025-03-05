import { execSync } from "child_process";
import { AppChildProcess } from "./AppChildProcess";
import * as fs from 'fs';
import * as path from 'path';
import { InstallationInfo } from "./InstallationInfo";
import { TorControlClient } from "./TorControlClient";


export interface TorInstallationInfo extends InstallationInfo { configFile?: string; isRunning?: boolean; };

export interface TorProcessParameters {
  path: string;
  createConfig?: boolean;
  port?: number;
  rpcPort?: number;
};

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

  private readonly _control: TorControlClient;

  public get control(): TorControlClient {
    return this._control;
  }

  private readonly _createConfig: boolean;
  private readonly _port?: number;
  private readonly _rpcPort?: number;
  private readonly _torControlPassword: string = 'test';

  constructor({ path, port, rpcPort, createConfig } : TorProcessParameters) {
    super({ command: path, args: TorProcess.defaultFlags, isExe: true });

    this._createConfig = typeof createConfig === 'boolean' ? createConfig : true;
    this._port = port;
    this._rpcPort = rpcPort;
    this._control = new TorControlClient(9051, this._torControlPassword);
  }

  public override async start(): Promise<void> {
    let message: string = "Starting tor process";

    message += `\n\t${this._isExe ? 'Path' : 'Command'}: ${this._command}`;

    if (this._args) {
      message += `\n\tFlags: ${this._args.join(" ")}`
    }

    console.log(message);

    const controlPassword = await this.hashPassword(this._torControlPassword);
    const port = this._port;
    const rpcPort = this._rpcPort;
    if (this._createConfig) TorProcess.createDefaultConfigFile({port, rpcPort, controlPassword});


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

  public static async isValidPath(executablePath: string): Promise<boolean> {
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

  public async getVersion(): Promise<string> {
    const proc = new AppChildProcess({
      command: this._command,
      args: [ '--version' ],
      isExe: this._isExe
    });

    const promise = new Promise<string>((resolve, reject) => {
      proc.onError((err: Error) => {
        console.log("TorProcess.getVersion(): proc.onError():");
        console.error(err);
        reject(err)
      });
      
      proc.onStdErr((err: string) => {
        console.log("TorProcess.getVersion(): proc.onStdErr()");
        console.error(err);
        reject(new Error(err));
      });

      proc.onStdOut((version: string) => {
        if (!version.includes('Tor version ')) {
          return;
        }

        const m = version.match(/Tor version (\d+\.\d+\.\d+\.\d+)/);

        if (!m) {
          reject(new Error('Could not parse tor version'));
          return;
        }

        const v = m[1];

        console.log("TorProcess.getVersion(): " + v);
        resolve(v);
      });
    });

    console.log("TorProcess.getVersion(): Before proc.start()");
    await proc.start();
    console.log("TorProcess.getVersion(): After proc.start()");

    return await promise;
  }

  public async hashPassword(password: string): Promise<string> {
    const proc = new AppChildProcess({
      command: this._command,
      args: [ '--hash-password', password ],
      isExe: this._isExe
    });

    const promise = new Promise<string>((resolve, reject) => {
      proc.onError((err: Error) => {
        console.log("TorProcess.hashPassword(): proc.onError():");
        console.error(err);
        reject(err)
      });
      
      proc.onStdErr((err: string) => {
        console.log("TorProcess.hashPassword(): proc.onStdErr()");
        console.error(err);
        reject(new Error(err));
      });

      proc.onStdOut((hashedPassword: string) => {
        console.log("TorProcess.hashPassword(): " + hashedPassword);
        resolve(hashedPassword);
      });
    });

    console.log("TorProcess.getVersion(): Before proc.start()");
    await proc.start();
    console.log("TorProcess.getVersion(): After proc.start()");

    return await promise;
  }

  // #region Static Utilities

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
  
  private static createDefaultConfigFile(options: { port?: number, rpcPort?: number, controlPassword?: string; }): void {
    this.createConfigDir();
    const { port, rpcPort, controlPassword } = options;
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

    if (controlPassword !== undefined) {
      content = `${content}
ControlPort 9051
HashedControlPassword ${controlPassword}
CookieAuthentication 0
`;
    }

    fs.writeFileSync(this.defaultConfigPath, content);
  }
  
  // #endregion
}
