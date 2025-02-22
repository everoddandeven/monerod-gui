import { Comparable } from "./Comparable";

export class I2pDaemonSettings extends Comparable<I2pDaemonSettings> {
  public allowIncomingConnections: boolean = true;
  public txProxyEnabled: boolean = true;
  public enabled: boolean = false;
  public path: string = "";
  public torAsOutproxy: boolean = false;

  public port: number = 18085;
  public rpcPort: number = 18089;

  public outproxy?: { host: string; port: number };

  public override clone(): I2pDaemonSettings {
    const result = Object.assign(new I2pDaemonSettings(), this);

    if (this.outproxy) result.outproxy = { ...this.outproxy };

    return result;
  }

  public static parse(obj: any): I2pDaemonSettings {
    const { allowIncomingConnections, txProxyEnabled, enabled, path, outproxy, torAsOutproxy } = obj;

    const result = new I2pDaemonSettings();

    if (typeof allowIncomingConnections === 'boolean') result.allowIncomingConnections = allowIncomingConnections;
    if (typeof txProxyEnabled === 'boolean') result.txProxyEnabled = txProxyEnabled;
    if (typeof enabled === 'boolean') result.enabled = enabled;
    if (typeof path === 'string') result.path = path;
    if (typeof outproxy === 'object') result.outproxy = { ...outproxy };
    if (typeof torAsOutproxy === 'boolean') result.torAsOutproxy = torAsOutproxy;

    return result;
  }

}