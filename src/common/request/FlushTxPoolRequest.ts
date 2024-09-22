import { JsonRPCRequest } from "./JsonRPCRequest";

export class FlushTxPoolRequest extends JsonRPCRequest {
    public override readonly method: string = 'flush_txpool';
    public override readonly restricted: boolean = true;
    public txIds: string[];

    constructor(txIds: string[]) {
        super();
        this.txIds = txIds;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'txids': this.txIds
        }

        return dict;
    }
}