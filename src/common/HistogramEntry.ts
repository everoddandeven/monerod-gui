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
        const amount = entry.amount;
        const totalInstances = entry.total_instances;
        const unlockedInstances = entry.unlocked_instances;
        const recentInstances = entry.recent_instances;

        return new HistogramEntry(amount, totalInstances, unlockedInstances, recentInstances);
    }
}