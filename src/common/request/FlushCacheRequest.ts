import { JsonRPCRequest } from "./JsonRPCRequest";

export class FlushCacheRequest extends JsonRPCRequest {
    public override readonly method: string = 'flush_cache';
    public readonly badTxs: boolean;
    public readonly badBlocks: boolean;

    constructor(badTxs: boolean = false, badBlocks: boolean = false) {
        super();
        this.badTxs = badTxs;
        this.badBlocks = badBlocks;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'bad_txs': this.badTxs,
            'bad_blocks': this.badBlocks
        };

        return dict;
    }
}