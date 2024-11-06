export class NetHashRateHistory {
    private readonly _history: NetHashRateHistoryEntry[] = [];
    private _last?: NetHashRateHistoryEntry;

    public get history(): NetHashRateHistoryEntry[] {
        return this._history;
    }

    public get last(): NetHashRateHistoryEntry | undefined {
        return this._last;
    }

    public add(gigaHashRate: number): void {
        const last = new NetHashRateHistoryEntry(gigaHashRate);
        this._history.push(last);
        this._last = last;
    }
}

export class NetHashRateHistoryEntry {
    public readonly gigaHashRate: number;
    public readonly date: Date;

    public constructor(gigaHashRate: number, date: Date = new Date()) {
        this.gigaHashRate = gigaHashRate;
        this.date = date;
    }
}