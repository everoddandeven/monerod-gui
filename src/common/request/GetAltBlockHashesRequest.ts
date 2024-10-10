import { RPCRequest } from "./RPCRequest";

export class GetAltBlockHashesRequest extends RPCRequest {
    public override readonly method: string = 'get_alt_block_hashes';
    public override readonly restricted: boolean = false;

    constructor() {
        super();
    }

    public override toDictionary(): { [key: string]: any; } {
        return {};
    }
}