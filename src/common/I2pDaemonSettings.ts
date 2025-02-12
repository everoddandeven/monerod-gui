import { Comparable } from "./Comparable";

export class I2pDaemonSettings extends Comparable<I2pDaemonSettings> {
  public syncOnClearNet: boolean = true;
  public allowIncomingConnections: boolean = true;
  public txProxyEnabled: boolean = true;
  public enabled: boolean = false;
  public path: string = "";

  public override clone(): I2pDaemonSettings {
    const result = Object.assign(new I2pDaemonSettings(), this);

    return result;
  }

  public static parse(obj: any): I2pDaemonSettings {
    const { syncOnClearNet, allowIncomingConnections, txProxyEnabled, enabled, path } = obj;

    const result = new I2pDaemonSettings();

    if (typeof syncOnClearNet === 'boolean') result.syncOnClearNet = syncOnClearNet;
    if (typeof allowIncomingConnections === 'boolean') result.allowIncomingConnections = allowIncomingConnections;
    if (typeof txProxyEnabled === 'boolean') result.txProxyEnabled = txProxyEnabled;
    if (typeof enabled === 'boolean') result.enabled = enabled;
    if (typeof path === 'string') result.path = path;

    return result;
  }

}