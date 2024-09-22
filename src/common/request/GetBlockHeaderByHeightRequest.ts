import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetBlockHeaderByHeightRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_block_header_by_height';
    public override readonly restricted: boolean = false;
    public readonly height: number;
    public readonly fillPowHash: boolean;

    constructor(height: number, fillPowHash: boolean = false) {
        super();
        this.height = height;
        this.fillPowHash = fillPowHash;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'height': this.height,
            'fill_pow_hash': this.fillPowHash
        }

        return dict;
    }
}