import { AuxPoW } from "./AuxPoW";

export class AddedAuxPow {
    public readonly blockTemplateBlob: string;
    public readonly blockHashingBlob: string;
    public readonly merkleRoot: string;
    public readonly merkleTreeDepth: string;
    public auxPoW: AuxPoW[];

    constructor(blockTemplateBlob: string, blockHashingBlob: string, merkleRoot: string, merkleTreeDepth: string, auxPoW: AuxPoW[]) {
        this.blockTemplateBlob = blockTemplateBlob;
        this.blockHashingBlob = blockHashingBlob;
        this.merkleRoot = merkleRoot;
        this.merkleTreeDepth = merkleTreeDepth;
        this.auxPoW = auxPoW;
    }

    public static parse(addedAuxPow: any): AddedAuxPow {
        const blockTemplateBlob: string = addedAuxPow.blocktemplate_blob;
        const blockHashingBlob: string = addedAuxPow.blockhashing_blob;
        const merkleRoot: string = addedAuxPow.merkle_root;
        const merkleTreeDepth: string = addedAuxPow.merkle_tree_depth;
        const auxPoW: AuxPoW[] = [];

        const _auxPoW: any[] | undefined = addedAuxPow.aux_pow;
        
        if (_auxPoW) _auxPoW.forEach((_pow) => auxPoW.push(AuxPoW.parse(_pow)));

        return new AddedAuxPow(blockTemplateBlob, blockHashingBlob, merkleRoot, merkleTreeDepth, auxPoW);
    }
}
