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
      const active: boolean = miningStatus.active;
      const address: string = miningStatus.address;
      const bgIdleThreshold: number = miningStatus.bg_idle_threshold;
      const bgMinIdleSeconds: number = miningStatus.bg_min_idle_seconds;
      const bgTarget: number = miningStatus.bg_target;
      const blockReward: number = miningStatus.block_reward;
      const blockTarget: number = miningStatus.block_target;
      const difficulty: number = miningStatus.difficulty;
      const difficultyTop64: number = miningStatus.difficulty_top64;
      const isBackgroundMiningEnabled: boolean = miningStatus.is_background_mining_enabled;
      const powAlgorithm: string = miningStatus.pow_algorithm;
      const speed: number = miningStatus.speed;
      const threadsCount: number = miningStatus.threads_count;
      const wideDifficulty: string = miningStatus.wide_difficulty;

      return new MiningStatus(
            active,
            address,
            bgIdleThreshold,
            bgMinIdleSeconds,
            bgTarget,
            blockReward,
            blockTarget,
            difficulty,
            difficultyTop64,
            isBackgroundMiningEnabled,
            powAlgorithm,
            speed,
            threadsCount,
            wideDifficulty
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

