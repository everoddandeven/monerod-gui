export class HistogramEntry {
    public readonly amount: number;
    public readonly totalInstances: number;
    public readonly unlockedInstances: number;
    public readonly recentInstances: number;
    
    constructor(amount: number, totalInstances: number, unlockedInstances: number, recentInstances: number) {
        this.amount = amount;
        this.totalInstances = totalInstances;
        this.unlockedInstances = unlockedInstances;
        this.recentInstances = recentInstances;
    }

    public static parse(entry: any) {
        const amount: number = entry.amount;
        const totalInstances: number = entry.total_instances;
        const unlockedInstances: number = entry.unlocked_instances;
        const recentInstances: number = entry.recent_instances;

        return new HistogramEntry(amount, totalInstances, unlockedInstances, recentInstances);
    }
}