/**
 * {
      "block_size": 5500,
      "block_weight": 5500,
      "cumulative_difficulty": 86164894009456483,
      "cumulative_difficulty_top64": 0,
      "depth": 0,
      "difficulty": 227026389695,
      "difficulty_top64": 0,
      "hash": "a6ad87cf357a1aac1ee1d7cb0afa4c2e653b0b1ab7d5bf6af310333e43c59dd0",
      "height": 2286454,
      "long_term_weight": 5500,
      "major_version": 14,
      "miner_tx_hash": "a474f87de1645ff14c5e90c477b07f9bc86a22fb42909caa0705239298da96d0",
      "minor_version": 14,
      "nonce": 249602367,
      "num_txes": 3,
      "orphan_status": false,
      "pow_hash": "",
      "prev_hash": "fa17fefe1d05da775a61a3dc33d9e199d12af167ef0ab37e52b51e8487b50f25",
      "reward": 1181337498013,
      "timestamp": 1612088597,
      "wide_cumulative_difficulty": "0x1321e83bb8af763",
      "wide_difficulty": "0x34dbd3cabf"
    },
 */

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