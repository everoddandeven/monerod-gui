import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetOutputDistributionRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_output_distribution';
    public override readonly restricted: boolean = false;

    public readonly amounts: number[];
    public readonly cumulative: boolean;
    public readonly fromHeight: number;
    public readonly toHeight: number;

    constructor(amounts: number[], cumulative: boolean, fromHeight: number, toHeight: number) {
        super();

        this.amounts = amounts;
        this.cumulative = cumulative;
        this.fromHeight = fromHeight;
        this.toHeight = toHeight;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'amounts': this.amounts,
            'cumulative': this.cumulative,
            'from_height': this.fromHeight,
            'to_height': this.toHeight
        };

        return dict;
    }
}