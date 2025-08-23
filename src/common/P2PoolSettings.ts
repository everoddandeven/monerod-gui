import { Comparable } from "./Comparable";
import { DaemonSettings } from "./DaemonSettings";

export class P2PoolSettings extends Comparable<P2PoolSettings> {
  public path: string = '';
  public wallet: string = '';
  public host: string = '127.0.0.1';
  public rpcPort: number = 0;
  public zmqPort: number = 0;
  public stratum: string[] = [];
  public p2p: string[] = [];
  public peers: string[] = [];
  public stratumBanTime: number = 600;
  public lightMode: boolean = false;
  public logLevel: number = 3;
  public dataDir: string = '';
  public sidechainConfig: string = '';
  public dataApi: string = '';
  public localApi: boolean = true;
  public stratumApi: boolean = false;
  public noCache: boolean = false;
  public noColor: boolean = true;
  public noRandomX: boolean = false;
  public outPeers: number = 10;
  public inPeers: number = 10;
  public startMining: number = 1;
  public mini: boolean = false;
  public nano: boolean = false;
  public noAutodiff: boolean = false;
  public rpcLogin: string = '';
  public socks5: string = '';
  public noDns: boolean = false;
  public p2pExternalPort: number = 0;
  public noUpnp: boolean = false;
  public noIgd: boolean = false;
  
  public noStratumHttp: boolean = false;

  private assertValid(): void {
    if (this.path === '') throw new Error('Empty p2pool path provided');
    if (!this.nano && !this.mini) throw new Error('Must select a p2pool pool');
    if (this.logLevel < 0 || this.logLevel > 6) throw new Error(`Invalid p2pool log level provided: ${this.logLevel}`);
  }

  public override clone(): P2PoolSettings {
    const result = Object.assign(new P2PoolSettings(), this);

    return result;
  }

  public getDataApi(): string {
    if (this.path !== '' && this.dataApi === '') {
      const separator: '\\' | '/' = this.path.includes('\\') ? '\\' : '/';
      const c = this.path.split(separator);
      c.pop();
      c.push('api');
      return c.join(separator);
    }

    return this.dataApi;
  }

  public getDataDir(): string {
    if (this.path !== '' && this.dataDir === '') {
      const separator: '\\' | '/' = this.path.includes('\\') ? '\\' : '/';
      const c = this.path.split(separator);
      c.pop();
      c.push('data');
      return c.join(separator);
    }

    return this.dataDir;
  }

  public toCommandOptions(): string[] {
    const options: string[] = [];

    this.assertValid();

    this.dataApi = this.getDataApi();
    this.dataDir = this.getDataDir();

    if (this.path !== '') options.push(this.path);
    if (this.wallet !== '') options.push('--wallet', this.wallet);
    if (this.localApi) options.push('--local-api');
    if (this.rpcPort) options.push('--rpc-port', `${this.rpcPort}`);
    if (this.zmqPort) options.push('--zmq-port', `${this.zmqPort}`);
    if (this.stratum.length > 0) options.push('--stratum', this.stratum.join(','));
    if (this.p2p.length > 0) options.push('--p2p', this.p2p.join(','));
    if (this.peers.length > 0) options.push('--addppers', this.peers.join(','));
    if (this.stratumBanTime !== 600) options.push('--stratum-ban-time', `${this.stratumBanTime}`);
    if (this.lightMode) options.push('--light-mode');
    if (this.logLevel >= 0 && this.logLevel <= 6) options.push('--loglevel', `${this.logLevel}`);
    if (this.dataDir !== '') options.push('--data-dir', this.dataDir);
    if (this.dataApi !== '') options.push('--data-api', this.dataApi);
    if (this.localApi || this.stratumApi) options.push('--local-api');
    if (this.noCache) options.push('--no-cache');
    if (this.noColor) options.push('--no-color');
    if (this.noRandomX) options.push('--no-randomx');
    if (this.outPeers > 10) options.push('--out-peers', `${this.outPeers}`);
    if (this.inPeers > 10) options.push('--in-peers', `${this.inPeers}`);
    if (this.startMining > 0) options.push('--start-mining', `${this.startMining}`);
    if (this.nano) options.push('--nano');
    if (this.mini) options.push('--mini');
    if (this.noAutodiff) options.push('--no-autodiff');
    if (this.rpcLogin !== '') options.push('--rpc-login', `${this.rpcLogin}`);
    if (this.socks5 !== '') options.push('--socks5', `${this.socks5}`);
    if (this.noDns) options.push('--no-dns');
    if (this.p2pExternalPort) options.push('--p2p-external-port', `${this.p2pExternalPort}`);
    if (this.noUpnp) options.push('--no-upnp');
    if (this.noIgd) options.push('--no-igd');

    if (this.noStratumHttp) options.push('--no-stratum-http');

    return options;
  }

  public static parse(data: any): P2PoolSettings {
    const settings = new P2PoolSettings();
    Object.assign(settings, data);
    return settings;
  }

  public static fromDaemonSettings(settings: DaemonSettings): P2PoolSettings {
    const { startMining, noZmq, noIgd, rpcLogin } = settings;
    
    if (noZmq) throw new Error('Must enable daemon ZMQ interface');
    
    const rpcPort = settings.getRpcPort();
    const zmqPort = settings.getZmqPubPort();
    const zmqPub = settings.getZmqPub();

    if (zmqPub === '') throw new Error("Must setup daemon ZMQ pub");
    //if (startMining === '') throw new Error("Must setup a wallet address to mine to.");

    const r = new P2PoolSettings();

    r.wallet = startMining;
    r.rpcPort = rpcPort;
    r.zmqPort = zmqPort;
    r.noIgd = noIgd;
    //r.socks5 = proxy;
    r.rpcLogin = rpcLogin;

    return r;
  }

}
