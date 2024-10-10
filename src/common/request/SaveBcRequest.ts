import { RPCRequest } from "./RPCRequest";

export class SaveBcRequest extends RPCRequest {
    public override readonly method: string = 'save_bc';
    public override readonly restricted: boolean = true;

    constructor() {
        super();
    }

    public toDictionary(): { [key: string]: any; } {
        return {};
    }
}