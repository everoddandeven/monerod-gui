import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetBlockRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_block';
    public override readonly restricted: boolean = false;

    public readonly height: number;
    public readonly hash: string;
    public readonly fillPoWHash: boolean;

    constructor(heightOrHash: number | string, fillPoWHash: boolean = false) {
        super();

        if (typeof heightOrHash == 'number') {
            this.height = heightOrHash;
            this.hash = '';
        }
        else if (typeof heightOrHash == 'string') {
            this.hash = heightOrHash;
            this.height = -1;
        }
        else {
            throw new Error('Invalid paramater heightOrHash, must be a number or a string');
        }

        this.fillPoWHash = fillPoWHash;
    }

    public get byHash(): boolean {
        return this.hash != '' && this.height < 0;
    }

    public get byHeight(): boolean {
        return this.hash == '' && this.height >= 0;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        let params: { [key: string]: any } = { 'fill_pow_hash': this.fillPoWHash };

        if (this.byHeight) {
            params['height'] = this.height;
        }
        else if (this.byHash) {
            params['hash'] = this.hash;
        }

        dict['params'] = params;

        return dict;
    }

}