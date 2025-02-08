import { DaemonSettings } from "./DaemonSettings";

export class DefaultPrivnetNode2Settings extends DaemonSettings {

    public override get isPrivnet(): boolean {
        return true;
    }

    constructor(monerodPath: string = '') {
        super();

        this.monerodPath = monerodPath;
        this.testnet = true;
        this.noIgd = true;
        this.hideMyPort = true;
        this.dataDir = '.localnet/xmr_local/node2';
        this.p2pBindIp = '127.0.0.1';
        this.p2pBindPort = 48080;
        this.rpcBindPort = 48081;
        this.zmqRpcBindPort = 48082;
        this.logLevel = 1;
        this.confirmExternalBind = true;
        this.addExclusiveNode('127.0.0.1:28080');
        this.addExclusiveNode('127.0.0.1:58080');
        this.rpcAccessControlOrigins = '*';
        this.fixedDifficulty = 500;
        this.disableRpcBan = true;
    }
}