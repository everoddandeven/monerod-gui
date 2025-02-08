import { PrivnetDaemonSettings } from "./PrivnetDaemonSettings";

export class DefaultPrivnetNode1Settings extends PrivnetDaemonSettings {

    constructor(monerodPath: string = '') {
        super(monerodPath, '.localnet/xmr_local/node1');

        this.addExclusiveNode('127.0.0.1:48080');
        this.addExclusiveNode('127.0.0.1:58080');
    }
}