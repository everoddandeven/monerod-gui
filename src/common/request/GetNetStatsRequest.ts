import { RPCRequest } from "./RPCRequest";

export class GetNetStatsRequest extends RPCRequest {
    public override readonly method: string = 'get_net_stats';
    public override readonly restricted: boolean = false;

    constructor() {
        super();
    }

    public override toDictionary(): { [key: string]: any; } {
        return { };
    }
}