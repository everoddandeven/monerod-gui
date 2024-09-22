import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetFeeEstimateRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_fee_estimate';
    public override readonly restricted: boolean = false;
    public readonly graceBlocks: number;

    constructor(graceBlocks: number = 0) {
        super();
        this.graceBlocks = graceBlocks;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();
        if (this.graceBlocks > 0) {
            dict['params'] = {
                'grace_blocks': this.graceBlocks
            };
        }

        return dict;
    }

}