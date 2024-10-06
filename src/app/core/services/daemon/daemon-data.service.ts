import { EventEmitter, Injectable } from '@angular/core';
import { DaemonService } from './daemon.service';
import { BlockCount, BlockHeader, Chain, DaemonInfo, MinerData, MiningStatus, NetStats, SyncInfo } from '../../../../common';

@Injectable({
  providedIn: 'root'
})
export class DaemonDataService {

  private refreshTimeoutMs: number = 5000;
  private refreshInterval?: NodeJS.Timeout;
  private _refreshing: boolean = false;
  private _firstRefresh: boolean = true;
  private _lastRefresh: number = Date.now();

  private _daemonRunning: boolean = false;
  private _daemonRestarting: boolean = false;

  private _daemonInfo?: DaemonInfo;
  private _gettingDaemonInfo: boolean = false;

  private _syncInfo?: SyncInfo;
  private _gettingSyncInfo: boolean = false;

  private _blockCount?: BlockCount;
  private _gettingBlockCount: boolean = false;

  private _isBlockchainPruned: boolean = false;
  private _gettingIsBlockchainPruned: boolean = false;

  private _lastBlockHeader?: BlockHeader;
  private _gettingLastBlockHeader: boolean = false;

  private _altChains: Chain[] = [];
  private _gettingAltChains: boolean = false;

  private _netStats?: NetStats;
  private _gettingNetStats: boolean = false;

  private _miningStatus?: MiningStatus;
  private _gettingMiningStatus: boolean = false;

  private _minerData?: MinerData;
  private _gettingMinerData: boolean = false;

  public readonly syncStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly syncEnd: EventEmitter<void> = new EventEmitter<void>();
  public readonly syncError: EventEmitter<Error> = new EventEmitter<Error>();

  public readonly syncInfoRefreshStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly syncInfoRefreshEnd: EventEmitter<void> = new EventEmitter<void>();

  constructor(private daemonService: DaemonService) {
    this.startLoop();

    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      if (running) {
        this.startLoop();
      }
      else {
        this.stopLoop();
      }
    })
  }

  public get initializing(): boolean {
    return this._firstRefresh;
  }

  public get running(): boolean {
    return this._daemonRunning;
  }

  public get starting(): boolean {
    return this.daemonService.starting;
  }

  public get stopping(): boolean {
    return this.daemonService.stopping;
  }

  public get restarting(): boolean {
    return this._daemonRestarting;
  }

  public get refreshing(): boolean {
    return this._refreshing;
  }

  public get info(): DaemonInfo | undefined {
    return this._daemonInfo;
  }

  public get gettingInfo(): boolean {
    return this._gettingDaemonInfo;
  }

  public get syncInfo(): SyncInfo | undefined {
    return this._syncInfo;
  }

  public get gettingSyncInfo(): boolean {
    return this._gettingSyncInfo;
  }

  public get blockCount(): BlockCount | undefined {
    return this._blockCount;
  }

  public get gettingBlockCount(): boolean {
    return this._gettingBlockCount;
  }

  public get isBlockchainPruned(): boolean {
    return this._isBlockchainPruned;
  }

  public get gettingIsBlockchainPruned(): boolean {
    return this._gettingIsBlockchainPruned;
  }

  public get lastBlockHeader(): BlockHeader | undefined {
    return this._lastBlockHeader;
  }

  public get gettingLastBlockHeader(): boolean {
    return this._gettingLastBlockHeader;
  }

  public get AltChains(): Chain[] {
    return this._altChains;
  }

  public get gettingAltChains(): boolean {
    return this._gettingAltChains;
  }

  public get netStats(): NetStats | undefined {
    return this.netStats;
  }

  public get gettingNetStats(): boolean {
    return this._gettingNetStats;
  }

  public get miningStatus(): MiningStatus | undefined {
    return this._miningStatus;
  }

  public get gettingMiningStatus(): boolean {
    return this._gettingMiningStatus;
  }

  public get gettingMinerData(): boolean {
    return this._gettingMinerData;
  }

  public setRefreshTimeout(ms: number = 5000): void {
    this.refreshTimeoutMs = ms;
  }

  private startLoop(): void {
    if (this.refreshInterval != undefined) {
      throw new Error("Loop already started");
    }
    this._firstRefresh = true;
    this.refreshInterval = setInterval(() => {
      this.refresh();
    },this.refreshTimeoutMs);
  }

  private stopLoop(): void {
    if (this.refreshInterval == undefined) {
      throw new Error("Loop already stopped");
    }

    clearInterval(this.refreshInterval);

    this.refreshInterval = undefined;
    this._refreshing = false;
  }

  private get tooEarlyForRefresh(): boolean {
    return Date.now() - this._lastRefresh <= this.refreshTimeoutMs;
  }

  private async getInfo(): Promise<void> {

  }

  private async refreshMiningStatus(): Promise<void> {
    this._gettingMiningStatus = true;

    try {
      this._miningStatus = await this.daemonService.miningStatus();
    }
    catch(error) {
      console.error(error);
    }

    this._gettingMiningStatus = false;
  }

  private async refreshMinerData(): Promise<void> {
    this._gettingMinerData = true;

    try {
      this._minerData = await this.daemonService.getMinerData();
    }
    catch (error) {
      console.error(error);
    }

    this._gettingMinerData = false;
  }

  private async refreshAltChains(): Promise<void> {
    this._gettingAltChains = true;

    try {
      this._altChains = await this.daemonService.getAlternateChains();
    }
    catch (error) {
      console.error(error);
    }

    this._gettingAltChains = false;

  }

  private async refresh(): Promise<void> {
    if (this.refreshing || this.tooEarlyForRefresh) {
      return;
    }

    this._refreshing = true;
    this.syncStart.emit();

    try {
      const firstRefresh = this._firstRefresh;
      this._daemonRunning = await this.daemonService.isRunning();
      this._firstRefresh = false;

      if (!this._daemonRunning) {
        this.syncEnd.emit();
        return;
      }

      this._gettingDaemonInfo = true;
      this._daemonInfo = await this.daemonService.getInfo();
      this._gettingDaemonInfo = false;

      this._gettingSyncInfo = true;
      this.syncInfoRefreshStart.emit();
      this._syncInfo = await this.daemonService.syncInfo();
      this._gettingSyncInfo = false;
      this.syncInfoRefreshEnd.emit();

      this._gettingBlockCount = true;
      this._blockCount = await this.daemonService.getBlockCount();
      this._gettingBlockCount = false;

      this._gettingLastBlockHeader = true;
      this._lastBlockHeader = await this.daemonService.getLastBlockHeader(true);
      this._gettingLastBlockHeader = false;

      this._gettingIsBlockchainPruned = true;
      if (firstRefresh) this._isBlockchainPruned = (await this.daemonService.pruneBlockchain(true)).pruned;
      this._gettingIsBlockchainPruned = false;

      await this.refreshAltChains();

      this._gettingNetStats = true;
      this._netStats = await this.daemonService.getNetStats();
      this._gettingNetStats = false;

      await this.refreshMiningStatus();

      await this.refreshMinerData();

      this._lastRefresh = Date.now();
    } catch(error) {
      console.error(error);
      this._gettingDaemonInfo = false;
      this._gettingSyncInfo = false;
      this._gettingBlockCount = false;
      this._gettingLastBlockHeader = false;
      this._gettingIsBlockchainPruned = false;
      this._gettingAltChains = false;
      this._gettingNetStats = false;

      this.syncError.emit(<Error>error);

      if (!await this.daemonService.isRunning()) {
        this.stopLoop();
      }
    }

    this.syncEnd.emit();
    this._firstRefresh = false;
    this._refreshing = false;
  }

}
