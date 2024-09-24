import { RPCRequest } from "./RPCRequest";

export class StopMiningRequest extends RPCRequest {
    public override readonly method: 'stop_mining' = 'stop_mining';
    public override readonly restricted: true = true;

    constructor() {
        super();
    }

    public toDictionary(): { [key: string]: any; } {
        return {};
    }
}