import { RPCRequest } from "./RPCRequest";

export class StopDaemonRequest extends RPCRequest {
    public override readonly method: 'stop_daemon' = 'stop_daemon';
    public override readonly restricted: true = true;

    constructor() {
        super();
    }

    public override toDictionary(): { [key: string]: any; } {
        return {};
    }
}