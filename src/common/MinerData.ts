import { MineableTxBacklog } from "./MineableTxBacklog";

export class MinerData {
    public readonly majorVersion: number;
    public readonly height: number;
    public readonly prevId: string;
    public readonly seedHash: string;
    public readonly difficulty: number;
    public readonly medianWeight: number;
    public readonly alreadyGeneratedCoins: number;
    public readonly txBacklog: MineableTxBacklog[];

    constructor(majorVersion: number, height: number, prevId: string, seedHash: string, difficulty: number, medianWeight: number, alreadyGeneratedCoins: number, txBacklog: MineableTxBacklog[]) {
        this.majorVersion = majorVersion;
        this.height = height;
        this.prevId = prevId;
        this.seedHash = seedHash;
        this.difficulty = difficulty;
        this.medianWeight = medianWeight;
        this.alreadyGeneratedCoins = alreadyGeneratedCoins;
        this.txBacklog = txBacklog;
    }

    public static parse(minerData: any): MinerData {
        const majorVersion: number = minerData.major_version;
        const height: number = minerData.height;
        const prevId: string = minerData.prev_id;
        const seedHash: string = minerData.seed_hash;
        const difficulty: number = minerData.difficulty;
        const medianWeight: number = minerData.median_weight;
        const alreadyGeneratedCoins: number = minerData.already_generated_coins;
        const _txBacklog: any[] | undefined = minerData.tx_backlog;
        const txBacklog: MineableTxBacklog[] = [];

        if (_txBacklog) {
          _txBacklog.forEach((txb: any) => {
            txBacklog.push(MineableTxBacklog.parse(txb));
          });
        }

        return new MinerData(majorVersion, height, prevId, seedHash, difficulty, medianWeight, alreadyGeneratedCoins, txBacklog);
    }
}