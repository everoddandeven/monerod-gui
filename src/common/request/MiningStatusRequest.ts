import { RPCRequest } from "./RPCRequest";

export class MiningStatusRequest extends RPCRequest {
    public override readonly method: 'mining_status' = 'mining_status';
    public override readonly restricted: true = true;

    constructor() {
        super();
    }

    public override toDictionary(): { [key: string]: any; } {
        return {};
    }
}