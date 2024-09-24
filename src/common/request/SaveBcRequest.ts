import { RPCRequest } from "./RPCRequest";

export class SaveBcRequest extends RPCRequest {
    public override readonly method: 'save_bc' = 'save_bc';
    public override readonly restricted: true = true;

    constructor() {
        super();
    }

    public toDictionary(): { [key: string]: any; } {
        return {};
    }
}