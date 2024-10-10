import { RPCRequest } from "./RPCRequest";

export class OutPeersRequest extends RPCRequest {
    public override readonly method: string = 'out_peers';
    public override readonly restricted: boolean = false;

    public readonly outPeers: number;

    constructor(outPeers: number) {
        super();

        this.outPeers = outPeers;
    }

    public override toDictionary(): { [key: string]: any; } {
        return {
            "out_peers": this.outPeers
        };
    }
}