import { RPCRequest } from "./RPCRequest";

export class PopBlocksRequest extends RPCRequest {
    public override readonly method: string = 'pop_blocks';
    public override readonly restricted: boolean = false;

    public readonly nBlocks: number;

    constructor(nBlocks: number) {
        super();

        this.nBlocks = nBlocks;
    }

    public override toDictionary(): { [key: string]: any; } {
        return {
            'nblocks': this.nBlocks
        }
    }
}