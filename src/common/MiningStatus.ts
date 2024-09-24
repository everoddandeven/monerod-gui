export class MiningStatus {
    public readonly active: boolean;
    public readonly address: string;
    public readonly bgIdleThreshold: number;
    public readonly bgMinIdleSeconds: number;
    public readonly bgTarget: number;
    public readonly blockReward: number;
    public readonly blockTarget: number;
    public readonly difficulty: number;
    public readonly difficultyTop64: number;
    public readonly isBackgroundMiningEnabled: boolean;
    public readonly powAlgorithm: string;
    public readonly speed: number;
    public readonly threadsCount: number;
    public readonly wideDifficulty: string;

    constructor(
        active: boolean,
        address: string,
        bgIdleThreshold: number,
        bgMinIdleSeconds: number,
        bgTarget: number,
        blockReward: number,
        blockTarget: number,
        difficulty: number,
        difficultyTop64: number,
        isBackgroundMiningEnabled: boolean,
        powAlgorithm: string,
        speed: number,
        threadsCount: number,
        wideDifficulty: string
    ) {
        this.active = active;
        this.address = address;
        this.bgIdleThreshold = bgIdleThreshold;
        this.bgMinIdleSeconds = bgMinIdleSeconds;
        this.bgTarget = bgTarget;
        this.blockReward = blockReward;
        this.blockTarget = blockTarget;
        this.difficulty = difficulty;
        this.difficultyTop64 = difficultyTop64;
        this.isBackgroundMiningEnabled = isBackgroundMiningEnabled;
        this.powAlgorithm = powAlgorithm;
        this.speed = speed;
        this.threadsCount = threadsCount;
        this.wideDifficulty = wideDifficulty;
    }

    public static parse(miningStatus: any): MiningStatus {
        return new MiningStatus(
            miningStatus.active,
            miningStatus.address,
            miningStatus.bg_idle_threshold,
            miningStatus.bg_min_idle_seconds,
            miningStatus.bg_target,
            miningStatus.block_reward,
            miningStatus.block_target,
            miningStatus.difficulty,
            miningStatus.difficulty_top64,
            miningStatus.is_background_mining_enabled,
            miningStatus.pow_algorithm,
            miningStatus.speed,
            miningStatus.threads_count,
            miningStatus.wide_difficulty
        );
    }
}


/**
 * {
  "active": true,
  "address": "47xu3gQpF569au9C2ajo5SSMrWji6xnoE5vhr94EzFRaKAGw6hEGFXYAwVADKuRpzsjiU1PtmaVgcjUJF89ghGPhUXkndHc",
  "bg_idle_threshold": 0,
  "bg_ignore_battery": false,
  "bg_min_idle_seconds": 0,
  "bg_target": 0,
  "block_reward": 1181637918707,
  "block_target": 120,
  "difficulty": 239928394679,
  "difficulty_top64": 0,
  "is_background_mining_enabled": false,
  "pow_algorithm": "RandomX",
  "speed": 23,
  "status": "OK",
  "threads_count": 1,
  "untrusted": false,
  "wide_difficulty": "0x37dcd8c3b7"
}
 */

