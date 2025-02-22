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

  private static get defaultP2pHiddenServiceDir(): string {
    return path.join(this.userDataPath, 'tor', 'hidden_services', 'monero_node_hidden_service')
  }

  private static get defaultRpcHiddenServiceDir(): string {
    return path.join(this.userDataPath, 'tor', 'hidden_services', 'monero_rpc_hidden_service')
  }

  private static get defaultConfigFlag(): string {
    return `--f=${this.defaultConfigPath}`;
  }

  private static get defaultFlags(): string[] {
    const flags: string[] = [];

    flags.push(this.defaultConfigFlag);

    return flags;
  }

  constructor(path: string, port?: number, rpcPort?: number) {
    super({ command: path, args: TorProcess.defaultFlags, isExe: true });

    TorProcess.createDefaultConfigFile({port, rpcPort});
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

  private static createConfigDir(): void {
    if (!fs.existsSync(path.join(this.userDataPath, 'tor'))) {
      fs.mkdirSync(path.join(this.userDataPath, 'tor'));
    }

    if (!fs.existsSync(path.join(this.userDataPath, 'tor', 'data'))) {
      fs.mkdirSync(path.join(this.userDataPath, 'tor', 'data'));
    }
  }
  
  private static createDefaultConfigFile(options: { port?: number, rpcPort?: number }): void {
    this.createConfigDir();
    const { port, rpcPort } = options;
    let content = `DataDirectory ${this.defaultDataDirectory}
HiddenServiceDir ${this.defaultP2pHiddenServiceDir}`;

    if (port !== undefined) {
      content = `${content}
HiddenServicePort ${port} 127.0.0.1:${port}    # interface for P2P network`
    }

    if (rpcPort !== undefined) {
      content = `${content}
HiddenServicePort ${rpcPort} 127.0.0.1:${rpcPort}    # interface for wallet RPC`
    }

    fs.writeFileSync(this.defaultConfigPath, content);
  }
  
}
