import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetBlockHeadersRangeRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_block_headers_range';
    public readonly startHeight: number;
    public readonly endHeight: number;
    public readonly fillPowHash: boolean;

    constructor(startHeight: number, endHeight: number, fillPowHash: boolean = false) {
        super();
        this.startHeight = startHeight;
        this.endHeight = endHeight;
        this.fillPowHash = fillPowHash;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'start_height': this.startHeight,
            'end_height': this.endHeight,
            'fill_pow_hash': this.fillPowHash
        }

        return dict;
    }
}