import { execSync } from "child_process";
import { AppChildProcess } from "./AppChildProcess";
import * as fs from 'fs';
import * as path from 'path';
import { I2pdInstallationInfo } from "./I2pdInstallationInfo";

export interface I2pTunnelConfig {
  name: string;
  type: 'server' | 'client';
  host: string;
  port: number;
  inport?: number;
  keys: string;
}

export abstract class I2pTunnelConfigCreator {
  public static get emptyConfig(): I2pTunnelConfig {
  return {
    name: '',
    type: 'server',
    host: '',
    port: 0,
    inport: 0,
    keys: ''
  };
  }
}

export abstract class I2pTunnelConfigValidator {

  public static validate(config: I2pTunnelConfig): void {
    const { name, type, host, port, inport, keys } = config;

    if (name === '') {
      throw new Error("Empty I2P tunnel config name");
    }
    if (type !== 'server' && type !== 'client') {
      throw new Error("Invalid I2P tunnel config type: " + type);
    }
    if (host == '') {
      throw new Error("Empty I2P tunnel config host");
    }
    if (port <= 0) {
      throw new Error("Invalid I2P tunnel config port: " + port);
    }
    if (inport !== undefined && inport < 0) {
      throw new Error("Invalid I2P tunnel config inport: " + inport);
    }
    if (keys === '') {
      throw new Error("Empty I2P tunnel config keys");
    }
  }

  public static isValid(config: I2pTunnelConfig): boolean {
    try {
      this.validate(config);
      return true;
    }
    catch (error: any) {
      console.error(error);
      return false;
    }
  }
}

export abstract class I2pTunnelConfigConverter {
  
  public static toString(...configs: I2pTunnelConfig[]): string {
  let result = '';

  configs.forEach((config, index) => {
    const configStr = config.inport !== undefined ? `[${config.name}]
    type = ${config.type}
    host = ${config.host}
    port = ${config.port}
    inport = ${config.inport}
    keys = ${config.keys}`
    :
    `[${config.name}]
    type = ${config.type}
    host = ${config.host}
    port = ${config.port}
    keys = ${config.keys}`
    ;

    if (index > 0) {
    result = `${result}
    
    ${configStr}
    `;
    }

    else result = configStr;
  });
  
  return result;
  }

}

export abstract class I2pTunnelConfigParser {

  public static fromString(configStr: string): I2pTunnelConfig[] {
    const result: I2pTunnelConfig[] = [];
    const lines = configStr.split('\n');
    let firstConfig: boolean = true;
    let currentConfig: I2pTunnelConfig | undefined = undefined;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) continue; // Skip empty lines and comments
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        if (firstConfig && currentConfig !== undefined) {
          firstConfig = false;
        }
        if (currentConfig !== undefined) {
          I2pTunnelConfigValidator.validate(currentConfig);
          result.push(currentConfig);
        }

        currentConfig = I2pTunnelConfigCreator.emptyConfig;
        currentConfig.name = trimmed.slice(1, -1);

      } else if (currentConfig) {
        const [key, ...valueParts] = trimmed.split('=');
        const keyTrimmed = key.trim();
        const valueTrimmed = valueParts.join('=').trim();
        
        let value: string | number = valueTrimmed;
        
        if (!isNaN(Number(valueTrimmed))) {
          value = Number(valueTrimmed);
        }

        if (keyTrimmed === 'name') {
          currentConfig.name = valueTrimmed;
        }
        else if (keyTrimmed === 'type') {
          currentConfig.type = valueTrimmed as 'server' | 'client';
        }
        else if (keyTrimmed === 'host') {
          currentConfig.host = valueTrimmed;
        }
        else if (keyTrimmed === 'port') {
          currentConfig.port = value as number;
        }
        else if (keyTrimmed === 'inport') {
          currentConfig.inport = value as number;
        }
        else if (keyTrimmed === 'keys') {
          currentConfig.keys = valueTrimmed;
        }
        else throw new Error("Invalid I2P tunnel config key: " + keyTrimmed);     
      }
    }

    if (currentConfig && I2pTunnelConfigValidator.isValid(currentConfig) && !result.includes(currentConfig)) {
      result.push(currentConfig);
    }

    return result;
  }
}

export abstract class I2pTunnelConfigWriter {

  public static write(config: I2pTunnelConfig | I2pTunnelConfig[], path: string): void {
  const configs = (Array.isArray(config)) ? config as I2pTunnelConfig[] : [config as I2pTunnelConfig];
  
  configs.forEach((c) => {
    if (!I2pTunnelConfigValidator.isValid(c)) {
    throw new Error("Invalid I2P config provided: " + c.name);
    }
  });

  fs.writeFileSync(path, I2pTunnelConfigConverter.toString(...configs));
  }
}

export abstract class I2pTunnelConfigReader {

  public static read(path: string): I2pTunnelConfig[] {
    if (!fs.existsSync(path)) {
      throw new Error("Path doesn't exits: " + path);
    }

    const content = fs.readFileSync(path, 'utf-8');

    return I2pTunnelConfigParser.fromString(content);
  }

  public static isValid(path: string): boolean {
    try {
      this.read(path);
      return true;
    }
    catch {
      return false;
    }
  }

}

export abstract class I2pTunnelConfigComparator {
  public static equals(config1: I2pTunnelConfig, config2: I2pTunnelConfig): boolean {
    return I2pTunnelConfigConverter.toString(config1) === I2pTunnelConfigConverter.toString(config2);
  }
}

export abstract class MoneroI2pTunnelConfigReader extends I2pTunnelConfigReader {

  public static override read(path: string): [I2pTunnelConfig, I2pTunnelConfig] {
    const result = super.read(path);

    const node = result.find((r) => r.name === 'monero-node');
    const rpc = result.find((r) => r.name === 'monero-rpc');

    if (!node) throw new Error("Could not find monero-node I2P tunnel configuration");
    if (!rpc) throw new Error("Could not find monero-rpc I2P tunnel configuration");


    return [node, rpc];
  }
}

export abstract class MoneroI2pTunnelConfigCreator {

  public static create({ host, keys, port, rpcPort }: { host: string; keys: string; port: number; rpcPort: number; }): [I2pTunnelConfig, I2pTunnelConfig] {
    const inport = 0;
    const type = 'server';

    const node: I2pTunnelConfig = {
      name: 'monero-node',
      type,
      host,
      keys,
      port,
      inport
    };

    const rpc: I2pTunnelConfig = {
      name: 'monero-rpc',
      type,
      host,
      keys,
      port: rpcPort
    };

    return [ node, rpc ];
  }

  private static getDefaultNodePort(networkType: 'mainnet' | 'stagenet' | 'testnet'): number {
    if (networkType === 'mainnet') return 18085;
    else if (networkType === 'stagenet') return 38085;
    return 28085;
  }

  private static getDefaultRpcPort(networkType: 'mainnet' | 'stagenet' | 'testnet'): number {
    if (networkType === 'mainnet') return 18089;
    else if (networkType === 'stagenet') return 38089;
    return 28089;
  }

  public static createSimple(networkType: 'mainnet' | 'stagenet' | 'testnet' = 'mainnet', port?: number, rpcPort?: number): [I2pTunnelConfig, I2pTunnelConfig] {
    port = port || this.getDefaultNodePort(networkType);
    rpcPort = rpcPort || this.getDefaultRpcPort(networkType);
    return this.create({ host: '127.0.0.1', keys: `monero-${networkType}.dat`, port, rpcPort })
  }

}

export class MoneroI2pTunnelConfigService {
  private _loading: boolean = false;
  private _saving: boolean = false;
  private _loaded: boolean = false;
  private _originalConfig: [I2pTunnelConfig, I2pTunnelConfig] = MoneroI2pTunnelConfigCreator.createSimple();
  private _config: [I2pTunnelConfig, I2pTunnelConfig] = MoneroI2pTunnelConfigCreator.createSimple();
  private _path: string = '';

  public get loaded(): boolean {
    return this._loaded;
  }

  public get loading(): boolean {
    return this._loading;
  }

  public get saving(): boolean {
    return this._saving;
  }

  public get node(): I2pTunnelConfig {
    return this._config[0];
  }

  public get rpc(): I2pTunnelConfig {
    return this._config[1];
  }

  public get path(): string {
    return this._path;
  }

  public get modified(): boolean {
    return !I2pTunnelConfigComparator.equals(this._originalConfig[0], this._config[0]) || !I2pTunnelConfigComparator.equals(this._originalConfig[1], this._config[1]);
  }

  constructor(path: string) {
    this._path = path;
  }

  public load(_path?: string): void {
    const path = _path || this._path;
    if (path === '') throw new Error("No path provided");
    if (this._loading) throw new Error("wait for last load");
    if (this._saving) throw new Error("wait for save");

    let err: any = null;
    this._loading = true;

    try {
      this._config = MoneroI2pTunnelConfigReader.read(path);
      this._originalConfig = [ { ...this._config[0] }, { ...this._config[1] }];
      this._loaded = true;
    }
    catch(error: any) {
      err = error;
    }

    this._loading = false;
    if (err) throw err;
  }

  public save(_path?: string): void {
    const path = _path || this._path;
    if (path == '') throw new Error("No path provided");
    if (this._loading) throw new Error("wait for last load");
    if (this._saving) throw new Error("already saving");

    let err: any = null;
    this._saving = true;

    try {
      //if (!this.modified) throw new Error("Config not modified");

      I2pTunnelConfigWriter.write(this._config, path);
      this._originalConfig = [ { ...this._config[0] }, { ...this._config[1] }];
      this._path = path;
      this._loaded = true;
    }
    catch(error: any) {
      err = error;
    }

    this._saving = false;
    if (err) throw err;
  }

  public setConfig(node: I2pTunnelConfig, rpc: I2pTunnelConfig, save: boolean = false): void {
    if (!I2pTunnelConfigValidator.isValid(node)) throw new Error("Invalid monero node i2p tunnel configuration provided");
    if (!I2pTunnelConfigValidator.isValid(rpc)) throw new Error("Invalid monero rpc i2p tunnel configuration provided");

    this._config = [node, rpc];
    this._loaded = true;

    if (save) this.save();
  }

}

export class I2pdProcess extends AppChildProcess {

  constructor({ i2pdPath, flags, isExe }: { i2pdPath: string, flags?: string[], isExe?: boolean }) {
    console.log("Creating I2pdProcess");
    super({
      command: i2pdPath,
      args: flags,
      isExe: isExe
    });
  }

  public override async start(): Promise<void> {
    let message: string = "Starting i2pd process";

    message += `\n\t${this._isExe ? 'Path' : 'Command'}: ${this._command}`;

    if (this._args) {
      message += `\n\tFlags: ${this._args.join(" ")}`
    }

    console.log(message);

    const promise = new Promise<void>((resolve, reject) => {
      let stdOutFound = false;

      const onStdOut = (out: string) => {
        stdOutFound = true;
        this.wait(3000).then(resolve);
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

    console.log(`Started i2pd process ${this._process?.pid}`);
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
      if (output.includes("i2pd")) {
      return true;
      }
    } catch (err) {
      return false;
    }

    return false;
  }

  public static async detectInstalled(): Promise<I2pdInstallationInfo | undefined> {
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

  private static async detectInstalledLinux(): Promise<I2pdInstallationInfo | undefined> {
    let path: string | undefined = undefined;
    let configFile: string | undefined = undefined;
    let tunnelConfig: string | undefined = undefined;
    let tunnelsConfigDir: string | undefined = undefined;
    let pidFile: string | undefined = undefined;
    let isRunning: boolean = false;

    if (await this.isValidPath('/usr/bin/i2pd')) {
      path = '/usr/bin/i2pd';
    }
    if (fs.existsSync('/etc/i2pd/i2pd.conf')) {
      configFile = '/etc/i2pd/i2pd.conf';
    }
    if (fs.existsSync('/etc/i2pd/tunnels.conf')) {
      tunnelConfig = '/etc/i2pd/tunnels.conf';
    }
    if (fs.existsSync('/etc/i2pd/tunnels.conf.d')) {
      tunnelsConfigDir = '/etc/i2pd/tunnels.conf.d'
    }
    if (fs.existsSync('/run/i2pd/i2pd.pid')) {
      pidFile = '/run/i2pd/i2pd.pid';
      isRunning = true;
    }

    if (path) {
      return { path, configFile, tunnelConfig, tunnelsConfigDir, pidFile, isRunning };
    }

    return undefined;
  }

  private static async detectInstalledWindows(): Promise<I2pdInstallationInfo | undefined> {
    return undefined;
  }

  private static async detectInstalledMacos(): Promise<I2pdInstallationInfo | undefined> {
    return undefined;
  }

}

export interface MoneroI2pdProcessOptions {

};

export class MoneroI2pdProcess extends I2pdProcess {

  public static readonly defaultFlags: string[] = [
    '--conf=/etc/i2pd/i2pd.conf',
    '--tunconf=/etc/i2pd/tunnels.conf',
    '--tunnelsdir=/etc/i2pd/tunnels.conf.d',
    //'--pidfile=/run/i2pd/i2pd.pid',
    '--logfile=/var/log/i2pd/i2pd.log',
    //'--daemon',
    //'--service'
  ];

  private static get defaultConfigPath(): string {
    return path.join(this.userDataPath, 'i2pd', 'i2pd.conf');
  }

  private static get defaultConfigFlag(): string {
    return `--conf=${this.defaultConfigPath}`;
  }

  private static get defaultTunnelsConfigPath(): string {
    return path.join(this.userDataPath, 'i2pd', 'tunnels.conf');
  }

  private static get defaultTunnelsConfigFlag(): string {
    return `--tunconf=${this.defaultTunnelsConfigPath}`;
  }

  private static get defaultTunnelsDirPath(): string {
    return path.join(this.userDataPath, 'i2pd', 'tunnels.conf.d');
  }

  private static get defaultTunnelsDirFlag(): string {
    return `--tunnelsdir=${this.defaultTunnelsDirPath}`;
  }

  private static get defaultLogPath(): string {
    return path.join(this.userDataPath, 'i2pd', 'i2pd.log');
  }

  private static get defaultLogFlag(): string {
    return `--logfile=${this.defaultLogPath}`;
  }

  private static getDefaultFlags(): string[] {
    return [
      this.defaultConfigFlag,
      this.defaultTunnelsConfigFlag,
      this.defaultTunnelsDirFlag,
      this.defaultLogFlag
    ];
  }

  private static createDefaultConfigFile(): void {
    if (!fs.existsSync(path.join(this.userDataPath, 'i2pd'))) {
      fs.mkdirSync(path.join(this.userDataPath, 'i2pd'));
    }

    fs.writeFileSync(this.defaultConfigPath, `ipv4 = true
ipv6 = false
daemon = false

[httpproxy]
enabled = false
outproxy = http://exit.stormycloud.i2p

[sam]
enabled = false

[socksproxy]
enabled = true
#outproxy.enabled = true
#outproxy = exit.stormycloud.i2p
#outproxy = 127.0.0.1
#outproxyport = 9050

[reseed]
verify = true
`);
  }

  private static createDefaultTunnelsConfigFile(): void {
    fs.writeFileSync(this.defaultTunnelsConfigPath, ``);
  }

  private static createDefaultTunnelsDir(port: number, rpcPort: number): void {
    const service = new MoneroI2pTunnelConfigService(path.join(this.defaultTunnelsConfigPath));
    const result = MoneroI2pTunnelConfigCreator.createSimple('mainnet', port, rpcPort);
    service.setConfig(result[0], result[1], true);
  }

  private static createDefaultLogFile(): void {
    fs.writeFileSync(this.defaultLogPath, ``);
  }

  public static createSimple(i2pdPath: string, port: number = 18080, rpcPort: number = 18081): MoneroI2pdProcess {
    this.createDefaultConfigFile();

    if (!fs.existsSync(this.defaultTunnelsConfigPath)) {
      this.createDefaultTunnelsConfigFile();
    }

    this.createDefaultTunnelsDir(port, rpcPort);

    if (!fs.existsSync(this.defaultLogPath)) {
      this.createDefaultLogFile();
    }

    const flags = this.getDefaultFlags();
    
    return new MoneroI2pdProcess({ i2pdPath, flags, isExe: true })
  }

}