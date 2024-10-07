import { NetStats } from "./NetStats";

export type NetStatsHistoryEntry = { date: Date, netStats: NetStats};

export class NetStatsHistory {
  private _history: NetStatsHistoryEntry[];
  private _last?: NetStatsHistoryEntry;

  public get history(): NetStatsHistoryEntry[] {
    return this._history;
  }

  public get last(): NetStatsHistoryEntry | undefined {
    return this._last;
  }

  constructor() {
    this._history = [];
  }

  public add(netStats: NetStats): void {
    const entry = {
      date: new Date(),
      netStats: netStats
    };

    this._history.push(entry);

    this._last = entry;
  }
}