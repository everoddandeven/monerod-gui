export class BlockTemplate {
    public readonly blockHashingBlob: string;
    public readonly blockTemplateBlob: string;
    public readonly difficulty: number;
    public readonly difficultyTop64: number;
    public readonly expectedReward: number;
    public readonly height: number;
    public readonly nextSeedHash: string;
    public readonly prevHash: string;
    public readonly reservedOffset: number;
    public readonly seedHash: string;
    public readonly seedHeight: number;
    public readonly status: string;
    public readonly untrusted: boolean;
    public readonly wideDifficulty: string;

    public get expectedRewardXMR(): number {
      return this.expectedReward / 1e12;
    }

    constructor(blockHashingBlob: string, blockTemplateBlob: string, difficulty: number, difficultyTop64: number, expectedReward: number, height: number, nextSeedHash: string, prevHash: string, reservedOffset: number, seedHash: string, seedHeight: number, status: string, untrusted: boolean, wideDifficulty: string) {
        this.blockHashingBlob = blockHashingBlob;
        this.blockTemplateBlob = blockTemplateBlob;
        this.difficulty = difficulty;
        this.difficultyTop64 = difficultyTop64;
        this.expectedReward = expectedReward;
        this.height = height;
        this.nextSeedHash = nextSeedHash;
        this.prevHash = prevHash;
        this.reservedOffset = reservedOffset;
        this.seedHash = seedHash;
        this.seedHeight = seedHeight;
        this.status = status;
        this.untrusted = untrusted;
        this.wideDifficulty = wideDifficulty;        
    }

    public static parse(blockTemplate: any): BlockTemplate {
        const blockHashingBlob: string = blockTemplate.blockhashing_blob;
        const blockTemplateBlob: string = blockTemplate.blocktemplate_blob;
        const difficulty: number = blockTemplate.difficulty;
        const difficultyTop64: number = blockTemplate.difficulty_top64;
        const expectedReward: number = blockTemplate.expected_reward;
        const height: number = blockTemplate.height;
        const nextSeedHash: string = blockTemplate.next_seed_hash;
        const prevHash: string = blockTemplate.prev_hash;
        const reservedOffset: number = blockTemplate.reserved_offset;
        const seedHash: string = blockTemplate.seed_hash;
        const seedHeight: number = blockTemplate.seed_height;
        const status: string = blockTemplate.status;
        const untrusted: boolean = blockTemplate.untrusted;
        const wideDifficulty: string = blockTemplate.wide_difficulty;
        return new BlockTemplate(blockHashingBlob, blockTemplateBlob, difficulty, difficultyTop64, expectedReward, height, nextSeedHash, prevHash, reservedOffset, seedHash, seedHeight, status, untrusted, wideDifficulty);
    }
}