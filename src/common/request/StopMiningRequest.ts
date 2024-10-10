import { RPCRequest } from "./RPCRequest";

export class StopMiningRequest extends RPCRequest {
    public override readonly method: string = 'stop_mining';
    public override readonly restricted: boolean = true;

    constructor() {
        super();
    }

    public toDictionary(): { [key: string]: any; } {
        return {};
    }
}