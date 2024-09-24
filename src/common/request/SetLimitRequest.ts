import { RPCRequest } from "./RPCRequest"

export class SetLimitRequest extends RPCRequest {
    public override readonly method: 'set_limit' = 'set_limit';
    public override readonly restricted: true = true;

    public readonly limitDown: number;
    public readonly limitUp: number;

    constructor(limitDown: number, limitUp: number) {
        super();
        this.limitDown = limitDown;
        this.limitUp = limitUp;
    }

    public override toDictionary(): { [key: string]: any; } {
        return {
            'limit_down': this.limitDown,
            'limit_up': this.limitUp
        }
    }
}