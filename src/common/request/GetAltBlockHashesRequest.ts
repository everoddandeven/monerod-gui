import { RPCRequest } from "./RPCRequest";

export class GetAltBlockHashesRequest extends RPCRequest {
    public override readonly method: 'get_alt_block_hashes' = 'get_alt_block_hashes';
    public override readonly restricted: false = false;

    constructor() {
        super();
    }

    public override toDictionary(): { [key: string]: any; } {
        return {};
    }
}