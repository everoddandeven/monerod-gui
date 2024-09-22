import { JsonRPCRequest } from "./JsonRPCRequest";


export class GetCoinbaseTxSumRequest extends JsonRPCRequest {
    public override readonly method: string = "get_coinbase_tx_sum";
    public override readonly restricted: boolean = true;
    public readonly height: number;
    public readonly count: number;

    constructor(height: number, count: number) {
        super();
        this.height = height;
        this.count = count;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'height': this.height,
            'count': this.count
        };

        return dict;
    }
}