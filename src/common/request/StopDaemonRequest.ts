import { RPCRequest } from "./RPCRequest";

export class StopDaemonRequest extends RPCRequest {
    public override readonly method: string = 'stop_daemon';
    public override readonly restricted: boolean = true;

    constructor() {
        super();
    }

    public override toDictionary(): { [key: string]: any; } {
        return {};
    }
}