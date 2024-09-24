export class OutputDistribution {
    public readonly amount: number;
    public readonly base: number;
    public readonly distribution: number[];
    public readonly startHeight: number;

    constructor(amount: number, base: number, distribution: number[], startHeight: number) {
        this.amount = amount;
        this.base = base;
        this.distribution = distribution;
        this.startHeight = startHeight;
    }

    public static parse(outDistribution: any): OutputDistribution {
        const amount = outDistribution.amount;
        const base = outDistribution.base;
        const startHeight = outDistribution.start_height;
        const distribution = outDistribution.distribution;

        return new OutputDistribution(amount, base, startHeight, distribution);
    }
}
