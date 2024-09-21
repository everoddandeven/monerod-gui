export class HardForkInfo {
    public readonly earliestHeight: number;
    public readonly enabled: boolean;
    public readonly state: number;
    public readonly threshold: number;
    public readonly topHash: string;
    public readonly version: number;
    public readonly votes: number;
    public readonly voting: number;
    public readonly window: number;
    
    constructor(earliestHeight: number, enabled: boolean, state: number, threshold: number, topHash: string, version: number, votes: number, voting: number, window: number) {
        this.earliestHeight = earliestHeight;
        this.enabled = enabled;
        this.state = state;
        this.threshold = threshold;
        this.topHash = topHash;
        this.version = version;
        this.votes = votes;
        this.voting = voting;
        this.window = window;
    }

    public static parse(hardForkInfo: any): HardForkInfo {
        const earliestHeight = hardForkInfo.earliest_height;
        const enabled = hardForkInfo.enabled;
        const state = hardForkInfo.state;
        const threshold = hardForkInfo.threshold;
        const topHash = hardForkInfo.top_hash;
        const version = hardForkInfo.version;
        const votes = hardForkInfo.votes;
        const voting = hardForkInfo.voting;
        const window = hardForkInfo.window;
        
        return new HardForkInfo(earliestHeight, enabled, state, threshold, topHash, version, votes, voting, window);
    }
}