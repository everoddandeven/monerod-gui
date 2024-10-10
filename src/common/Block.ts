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
        const blob: string= block.blob;
        const blockHeader = BlockHeader.parse(<string>block.block_header);

        if (typeof blob != 'string' || typeof block.json != 'string') {
          throw new Error("Could not parse block object");
        }

        const details = BlockDetails.parse(<string>block.json);

        return new Block(blob, blockHeader, details);
    }
}