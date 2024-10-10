export class BlockchainPruneInfo {
    public readonly pruned: boolean;
    public readonly pruningSeed: number;

    constructor(pruned: boolean, pruningSeed: number) {
        this.pruned = pruned;
        this.pruningSeed = pruningSeed;
    }

    public static parse(info: any): BlockchainPruneInfo {
        const pruned: boolean = info.pruned;
        const pruningSeed: number = info.pruning_seed;

        return new BlockchainPruneInfo(pruned, pruningSeed);
    }
}