export class Chain {
    public readonly blockHash: string;
    public readonly blockHashes: string[];
    public readonly difficulty: number;
    public readonly difficultyTop64: number;
    public readonly height: number;
    public readonly length: number;
    public readonly mainChainParentBlock: string;
    public readonly wideDifficulty: string;

    constructor(blockHash: string, blockHashes: string[], difficulty: number, difficultyTop64: number, height: number, length: number, mainChainParentBlock: string, wideDifficulty: string) {
        this.blockHash = blockHash;
        this.blockHashes = blockHashes;
        this.difficulty = difficulty;
        this.difficultyTop64 = difficultyTop64;
        this.height = height;
        this.length = length;
        this.mainChainParentBlock = mainChainParentBlock;
        this.wideDifficulty = wideDifficulty;
    }

    public static parse(chain: any): Chain {
        const blockHash: string = chain.block_hash;
        const blockHashes: string[] = chain.block_hashes;
        const difficulty: number = chain.difficulty;
        const difficultyTop64: number = chain.difficulty_top64;
        const height: number = chain.height;
        const length: number = chain.length;
        const mainChainParentBlock: string = chain.main_chain_parent_block;
        const wideDifficulty: string = chain.wide_difficulty;

        return new Chain(blockHash, blockHashes, difficulty, difficultyTop64, height, length, mainChainParentBlock, wideDifficulty);
    }
}