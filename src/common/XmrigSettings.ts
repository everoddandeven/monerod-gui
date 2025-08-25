import { Comparable } from "./Comparable";
import { DaemonSettings } from "./DaemonSettings";

export class XmrigSettings extends Comparable<XmrigSettings> {
  public path: string = '';
  public user: string = '';
  public threads: number = 1;
  public rigId: string = '';
  public url: string = '127.0.0.1:3333';
  public httpHost: string = '127.0.0.1';
  public httpPort: number = 18088;
  public coin: string = '';
  public daemon: boolean = true;
  public daemonZmqPort: number = 0;
  public background: boolean = false;
  public pauseOnBattery: boolean = false;
  public noColor: boolean = true;

  public override clone(): XmrigSettings {
    const result = Object.assign(new XmrigSettings(), this);

    return result;
  }

  public toCommandOptions(): string[] {
    const cmdList: string[] = [];
    if (!this.path) throw new Error("Xmrig path not configured");
    cmdList.push(this.path);
    if (this.user) cmdList.push('--user=' + this.user);
    if (this.threads) cmdList.push(`--threads=${this.threads}`);
    if (this.rigId) cmdList.push(`--rig-id=${this.rigId}`);
    if (this.url) cmdList.push(`--url=${this.url}`);
    //if (this.httpHost) cmdList.push(`--http-host=${this.httpHost}`);
    //if (this.httpPort > 0) cmdList.push(`--http-port=${this.httpPort}`);
    if (this.daemon) cmdList.push('--daemon');
    if (this.daemonZmqPort > 0) cmdList.push(`--daemon-zmq-port=${this.daemonZmqPort}`);
    if (this.coin) cmdList.push(`--coin=${this.coin}`);
    if (this.background) cmdList.push(`--background`);
    if (this.pauseOnBattery) cmdList.push(`--pause-on-battery`);
    if (this.noColor) cmdList.push(`--no-color`);
    
    return cmdList;
  }

  public static parse(i: any): XmrigSettings {
    const r = new XmrigSettings();

    r.path = i.path as string;
    r.user = i.user as string;
    r.threads = i.threads as number;
    r.rigId = i.rigId as string;
    r.url = i.url as string;
    r.httpHost = i.httpHost as string;
    r.httpPort = i.httpPort as number;

    return r;
  }

  public static fromDaemonSettings(s: DaemonSettings): XmrigSettings {
    const r = new XmrigSettings();

    r.user = s.startMining;
    r.threads = s.miningThreads;
    
    return r;
  }
}
