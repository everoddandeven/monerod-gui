import { RPCRequest } from "./RPCRequest";

export class GetTransactionsRequest extends RPCRequest {
    public override readonly method: string = 'get_transactions';
    public override readonly restricted: boolean = false;
    public readonly txHashes: string[];
    public readonly decodeAsJson: boolean;
    public readonly prune: boolean;
    public readonly split: boolean;

    constructor(txHashes: string[], decodeAsJson: boolean, prune: boolean, split: boolean) {
        super();
        this.txHashes = txHashes;
        this.decodeAsJson = decodeAsJson;
        this.prune = prune;
        this.split = split;
    }

    public toDictionary(): { [key: string]: any; } {
        return {
            "tx_hashes": this.txHashes,
            "decodeAsJson": this.decodeAsJson,
            "prune": this.prune,
            "split": this.split
        }
    }
}