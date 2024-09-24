import { BlockDetails } from "./BlockDetails";
import { BlockHeader } from "./BlockHeader";

export class Block {
    public readonly blob: string;
    public readonly blockHeader: BlockHeader;
    public readonly details: BlockDetails;

    constructor(blob: string, blockHeader: BlockHeader, details: BlockDetails) {
        this.blob = blob;
        this.blockHeader = blockHeader;
        this.details = details;
    }

    public static parse(block: any): Block {
        const blob = block.blob;
        const blockHeader = BlockHeader.parse(block.block_header);
        const details = BlockDetails.parse(block.json);

        return new Block(blob, blockHeader, details);
    }
}