import { Comparable } from "./Comparable";

export class TorDaemonSettings extends Comparable<TorDaemonSettings> {
  public allowIncomingConnections: boolean = true;
  public txProxyEnabled: boolean = true;
  public enabled: boolean = false;
  public path: string = "";

  public port: number = 18085;
  public rpcPort: number = 18089;

  public outproxy?: { host: string; port: number };

  public override clone(): TorDaemonSettings {
    const result = Object.assign(new TorDaemonSettings(), this);

    if (this.outproxy) result.outproxy = { ...this.outproxy };

    return result;
  }

  public static parse(obj: any): TorDaemonSettings {
    const { allowIncomingConnections, txProxyEnabled, enabled, path, outproxy } = obj;

    const result = new TorDaemonSettings();

    if (typeof allowIncomingConnections === 'boolean') result.allowIncomingConnections = allowIncomingConnections;
    if (typeof txProxyEnabled === 'boolean') result.txProxyEnabled = txProxyEnabled;
    if (typeof enabled === 'boolean') result.enabled = enabled;
    if (typeof path === 'string') result.path = path;
    if (typeof outproxy === 'object') result.outproxy = { ...outproxy };

    return result;
  }
}