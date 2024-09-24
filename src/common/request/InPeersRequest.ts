import { RPCRequest } from "./RPCRequest";

export class InPeersRequest extends RPCRequest {
    public override readonly method: 'in_peers' = 'in_peers';
    public override readonly restricted: false = false;

    public readonly inPeers: number;

    constructor(inPeers: number) {
        super();

        this.inPeers = inPeers;
    }

    public override toDictionary(): { [key: string]: any; } {
        return {
            "in_peers": this.inPeers
        };
    }
}