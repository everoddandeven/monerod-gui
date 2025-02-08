import { DaemonSettings } from "./DaemonSettings";

export class DefaultPrivnetNode1Settings extends DaemonSettings {

    public override get isPrivnet(): boolean {
        return true;
    }

    constructor(monerodPath: string = '') {
        super();
        this.monerodPath = monerodPath;
        this.testnet = true;
        this.noIgd = true;
        this.hideMyPort = true;
        this.dataDir = '.localnet/xmr_local/node1';
        this.p2pBindIp = '127.0.0.1';
        this.logLevel = 0;
        this.addExclusiveNode('127.0.0.1:48080');
        this.addExclusiveNode('127.0.0.1:58080');
        this.rpcAccessControlOrigins = '*';
        this.fixedDifficulty = 500;
        this.disableRpcBan = true;
    }
}