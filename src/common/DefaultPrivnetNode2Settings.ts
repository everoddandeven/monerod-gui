import { PrivnetDaemonSettings } from "./PrivnetDaemonSettings";

export class DefaultPrivnetNode2Settings extends PrivnetDaemonSettings {

    constructor(monerodPath: string = '') {
        super(monerodPath, '.localnet/xmr_local/node2');

        this.p2pBindPort = 48080;
        this.rpcBindPort = 48081;
        this.zmqRpcBindPort = 48082;
        this.logLevel = 1;
        this.confirmExternalBind = true;
        this.addExclusiveNode('127.0.0.1:28080');
        this.addExclusiveNode('127.0.0.1:58080');
    }
}