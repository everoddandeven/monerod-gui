import { JsonRPCRequest } from "./JsonRPCRequest";

export class GenerateBlocksRequest extends JsonRPCRequest {
    public override method: string = "generateblocks";
    public readonly amountOfBlocks: number;
    public readonly walletAddress: string;
    public readonly prevBlock: string;
    public readonly startingNonce: number;

    constructor(amountOfBlocks: number, walletAddress: string, prevBlock: string = '', startingNonce: number = 0) {
        super();
        this.amountOfBlocks = amountOfBlocks;
        this.walletAddress = walletAddress;
        this.prevBlock = prevBlock;
        this.startingNonce = startingNonce;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();
        
        const params: { [key: string]: any } = {
            'amount_of_blocks': this.amountOfBlocks,
            'wallet_address': this.walletAddress,
            'starting_nonce': this.startingNonce
        }

        if (this.prevBlock != '') {
            params['prev_block'] = this.prevBlock;
        }

        dict['params'] = params;

        return dict;
    }
}