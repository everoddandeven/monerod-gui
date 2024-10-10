import { RPCRequest } from "./RPCRequest";

export class MiningStatusRequest extends RPCRequest {
    public override readonly method: string = 'mining_status';
    public override readonly restricted: boolean = true;

    constructor() {
        super();
    }

    public override toDictionary(): { [key: string]: any; } {
        return {};
    }
}