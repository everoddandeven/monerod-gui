import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetBlockHeaderByHashRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_block_header_by_hash';
    public readonly hash: string;
    public readonly fillPowHash: boolean;

    constructor(hash: string, fillPowHash: boolean = false) {
        super();

        this.hash = hash;
        this.fillPowHash = fillPowHash;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'hash': this.hash,
            'fill_pow_hash': this.fillPowHash
        }

        return dict;
    }
}