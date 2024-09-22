import { JsonRPCRequest } from "./JsonRPCRequest";

export class RelayTxRequest extends JsonRPCRequest {
    public override readonly method: string = 'relay_tx';
    public override readonly restricted: boolean = true;
    public readonly txIds: string[];

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