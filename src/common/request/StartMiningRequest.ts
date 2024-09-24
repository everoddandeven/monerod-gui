import { RPCRequest } from "./RPCRequest";

export class StartMiningRequest extends RPCRequest {
    public override readonly method: 'start_mining' = 'start_mining';
    public override readonly restricted: true = true;
    public readonly doBackgroundMining: boolean;
    public readonly ignoreBattery: boolean;
    public readonly minerAddress: string;
    public readonly threadsCount: number;

    constructor(doBackgroundMining: boolean, ignoreBattery: boolean, minerAddress: string, threadsCount: number) {
        super();
        this.doBackgroundMining = doBackgroundMining;
        this.ignoreBattery = ignoreBattery;
        this.minerAddress = minerAddress;
        this.threadsCount = threadsCount;
    }

    public override toDictionary(): { [key: string]: any; } {
        return {
            "do_background_mining": this.doBackgroundMining,
            "ignore_battery": this.ignoreBattery,
            "miner_address": this.minerAddress,
            "threads_count": this.threadsCount
        }
    }
}