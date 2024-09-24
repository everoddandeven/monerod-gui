import { RPCRequest } from "./RPCRequest";

export class GetTransactionPoolHashesRequest extends RPCRequest {
    public override readonly method: 'get_transaction_pool_hashes' = 'get_transaction_pool_hashes';
    public override readonly restricted: boolean = false;

    constructor() {
        super();
    }

    public override toDictionary(): { [key: string]: any; } {
        return { };
    }
}