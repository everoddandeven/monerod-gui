import { RPCBinaryRequest } from "./RPCBinaryRequest";

export class GetTransactionPoolHashesBinaryRequest extends RPCBinaryRequest {
    public override readonly method: string = 'get_transaction_pool_hashes.bin';
    public override readonly restricted: boolean = false;

    constructor() {
        super();
    }

    public override toDictionary(): { [key: string]: any; } {
        return { };
    }
}