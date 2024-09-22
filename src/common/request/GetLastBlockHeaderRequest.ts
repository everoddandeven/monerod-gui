import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetLastBlockHeaderRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_last_block_header';
    public override readonly restricted: boolean = false;
    public readonly fillPowHash: boolean;

    constructor(fillPowHash: boolean = false) {
        super();
        this.fillPowHash = fillPowHash;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'fill_pow_hash': this.fillPowHash
        }

        return dict;
    }
}