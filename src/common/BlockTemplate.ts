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
        const blockHashingBlob = blockTemplate.blockhashing_blob;
        const blockTemplateBlob = blockTemplate.blocktemplate_blob;
        const difficulty = blockTemplate.difficulty;
        const difficultyTop64 = blockTemplate.difficulty_top64;
        const expectedReward = blockTemplate.expected_reward;
        const height = blockTemplate.height;
        const nextSeedHash = blockTemplate.next_seed_hash;
        const prevHash = blockTemplate.prev_hash;
        const reservedOffset = blockTemplate.reserved_offset;
        const seedHash = blockTemplate.seed_hash;
        const seedHeight = blockTemplate.seed_height;
        const status = blockTemplate.status;
        const untrusted = blockTemplate.untrusted;
        const wideDifficulty = blockTemplate.wide_difficulty;
        return new BlockTemplate(blockHashingBlob, blockTemplateBlob, difficulty, difficultyTop64, expectedReward, height, nextSeedHash, prevHash, reservedOffset, seedHash, seedHeight, status, untrusted, wideDifficulty);
    }
}