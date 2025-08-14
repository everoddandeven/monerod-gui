export class BlockHeader {
    public readonly blockSize: number;
    public readonly blockWeight: number;
    public readonly cumulativeDifficulty: number;
    public readonly cumulativeDifficultyTop64: number;
    public readonly depth: number;
    public readonly difficulty: number;
    public readonly difficultyTop64: number;
    public readonly hash: string;
    public readonly height: number;
    public readonly longTermWeight: number;
    public readonly majorVersion: number;
    public readonly minerTxHash: string;
    public readonly minorVersion: number;
    public readonly nonce: number;
    public readonly numTxes: number;
    public readonly orphanStatus: boolean;
    public readonly powHash: string;
    public readonly prevHash: string;
    public readonly reward: number;
    public readonly timestamp: number;
    public readonly wideCumulativeDifficulty: string;
    public readonly wideDifficulty: string;

    public get timestampMs(): number {
        return this.timestamp * 1000;        
    }

    public get rewardXMR(): number {
      return this.reward / 1e12;
    }

    constructor(blockSize: number, blockWeight: number, cumulativeDifficulty: number, cumulativeDifficultyTop64: number, depth: number, difficulty: number, difficultyTop64: number, hash: string, height: number, longTermWeight: number, majorVersion: number
        , minerTxHash: string, minorVersion: number, nonce: number, numTxes: number, orphanStatus: boolean, powHash: string, prevHash: string, reward: number, timestamp: number, wideCumulativeDifficulty: string, wideDifficulty: string
    ) {
        this.blockSize = blockSize;
        this.blockWeight = blockWeight;
        this.cumulativeDifficulty = cumulativeDifficulty;
        this.cumulativeDifficultyTop64 = cumulativeDifficultyTop64;
        this.depth = depth;
        this.difficulty = difficulty;
        this.difficultyTop64 = difficultyTop64;
        this.hash = hash;
        this.height = height;
        this.longTermWeight = longTermWeight;
        this.majorVersion = majorVersion;
        this.minerTxHash = minerTxHash;
        this.minorVersion = minorVersion;
        this.nonce = nonce;
        this.numTxes = numTxes;
        this.orphanStatus = orphanStatus;
        this.powHash = powHash;
        this.prevHash = prevHash;
        this.reward = reward;
        this.timestamp = timestamp;
        this.wideCumulativeDifficulty = wideCumulativeDifficulty;
        this.wideDifficulty = wideDifficulty;
    }

    public static parse(blockHeader: any): BlockHeader {
        const blockSize: number = blockHeader.block_size;
        const blockWeight: number = blockHeader.block_weight;
        const cumulativeDifficulty: number = blockHeader.cumulative_difficulty;
        const cumulativeDifficultyTop64: number = blockHeader.cumulative_difficulty_top64;
        const depth: number = blockHeader.depth;
        const difficulty: number = blockHeader.difficulty;
        const difficultyTop64: number = blockHeader.difficulty_top64;
        const hash: string = blockHeader.hash;
        const height: number = blockHeader.height;
        const longTermWeight: number = blockHeader.long_term_weight;
        const majorVersion: number = blockHeader.major_version;
        const minerTxHash: string = blockHeader.miner_tx_hash;
        const minorVersion: number = blockHeader.minor_version;
        const nonce: number = blockHeader.nonce;
        const numTxes: number = blockHeader.num_txes;
        const orphanStatus: boolean = blockHeader.orphan_status;
        const powHash: string = blockHeader.pow_hash;
        const prevHash: string = blockHeader.prev_hash;
        const reward: number = blockHeader.reward;
        const timestamp: number = blockHeader.timestamp;
        const wideCumulativeDifficulty: string = blockHeader.wide_cumulative_difficulty;
        const wideDifficulty: string = blockHeader.wide_difficulty;
        
        return new BlockHeader(blockSize, blockWeight, cumulativeDifficulty, cumulativeDifficultyTop64, depth, difficulty, difficultyTop64, hash, height, longTermWeight, majorVersion, minerTxHash, minorVersion, nonce, numTxes, orphanStatus, powHash, prevHash, reward, timestamp, wideCumulativeDifficulty, wideDifficulty);
    } 
}