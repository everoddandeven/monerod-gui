import { EventEmitter, Injectable, NgZone, inject } from '@angular/core';
import { DaemonService } from './daemon.service';
import { BlockCount, BlockHeader, Chain, CoreIsBusyError, DaemonInfo, MinerData, MiningStatus, NetHashRateHistory, NetStats, NetStatsHistory, ProcessStats, SyncInfo, TimeUtils, TxBacklogEntry, TxPool, TxPoolStats } from '../../../../common';
import { ElectronService } from '../electron/electron.service';

@Injectable({
  providedIn: 'root'
})
export class DaemonDataService {
  private daemonService = inject(DaemonService);
  private electronService = inject(ElectronService);
  private ngZone = inject(NgZone);


  private refreshTimeoutMs: number = 5000;
  private refreshInterval?: NodeJS.Timeout;
  private _refreshing: boolean = false;
  private _firstRefresh: boolean = true;
  private _lastRefresh: number = Date.now();

  private _daemonRunning: boolean = false;

  private _processStats?: ProcessStats;
  private _gettingProcessStats: boolean = false;

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
  private _netStatsHistory: NetStatsHistory = new NetStatsHistory();
  private _gettingNetStats: boolean = false;

  private _hashRateHistory: NetHashRateHistory = new NetHashRateHistory();

  private _miningStatus?: MiningStatus;
  private _gettingMiningStatus: boolean = false;

  private _minerData?: MinerData;
  private _minerDataCoreBusyError: boolean = false;
  private _gettingMinerData: boolean = false;

  private _transactionPool?: TxPool;
  private _gettingTransactionPool: boolean = false;

  private _txPoolBacklog: TxBacklogEntry[] = [];
  private _gettingTxPoolBackLog: boolean = false;

  private _txPoolStats?: TxPoolStats;
  private _gettingTxPoolStats: boolean = false;

  private _runningOnBattery?: boolean;
  public get runningOnBattery(): boolean {
    return this._runningOnBattery === true;
  }

  public readonly syncStart: EventEmitter<{ first: boolean }> = new EventEmitter<{ first: boolean }>();
  public readonly syncEnd: EventEmitter<void> = new EventEmitter<void>();
  public readonly syncError: EventEmitter<any> = new EventEmitter<any>();

  public readonly syncInfoRefreshStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly syncInfoRefreshEnd: EventEmitter<void> = new EventEmitter<void>();

  public readonly netStatsRefreshStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly netStatsRefreshEnd: EventEmitter<void> = new EventEmitter<void>();

  constructor() {

    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.ngZone.run(() => {
        this._hashRateHistory = new NetHashRateHistory();
        if (running) {
          this._daemonRunning = true;
          this.startLoop();
        }
        else {
          if (this.refreshInterval) this.stopLoop();
        }
      });
    });

    this.electronService.onAcPower.subscribe(() => this._runningOnBattery = false);
    this.electronService.onBatteryPower.subscribe(() => this._runningOnBattery = true);

    this.electronService.isOnBatteryPower().then((value: boolean) => this._runningOnBattery = value).catch((error: any) => console.error(error));
  }

  public get initializing(): boolean {
    return this._firstRefresh;
  }

  public get running(): boolean {
    return this._daemonRunning
  }

  public get starting(): boolean {
    return this.daemonService.starting;
  }

  public get stopping(): boolean {
    return this.daemonService.stopping;
  }

  public get restarting(): boolean {
    return this.daemonService.restarting;
  }

  public get refreshing(): boolean {
    return this._refreshing;
  }

  public get processStats(): ProcessStats | undefined {
    return this._processStats;
  }

  public get gettingProcessStats(): boolean {
    return this._gettingProcessStats;
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

  public get altChains(): Chain[] {
    return this._altChains;
  }

  public get gettingAltChains(): boolean {
    return this._gettingAltChains;
  }

  public get netStats(): NetStats | undefined {
    return this.netStats;
  }

  public get netStatsHistory(): NetStatsHistory {
    return this._netStatsHistory;
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

  public get minerData(): MinerData | undefined {
    return this._minerData;
  }

  public get minerDataCoreBusyError(): boolean {
    return this._minerDataCoreBusyError;
  }

  public get gettingMinerData(): boolean {
    return this._gettingMinerData;
  }

  public get transactionPool(): TxPool | undefined {
    return this._transactionPool;
  }

  public get gettingTransactionPool(): boolean {
    return this._gettingTransactionPool;
  }

  public get txPoolBacklog(): TxBacklogEntry[] {
    return this._txPoolBacklog;
  }

  public get gettingTxPoolBacklog(): boolean {
    return this._gettingTxPoolBackLog;
  }

  public get txPoolStats(): TxPoolStats | undefined {
    return this._txPoolStats;
  }

  public get gettingTxPoolStats(): boolean {
    return this._gettingTxPoolStats;
  }

  public get netHashRateHistory(): NetHashRateHistory {
    return this._hashRateHistory;
  }

  public setRefreshTimeout(ms: number = 5000): void {
    this.refreshTimeoutMs = ms;
  }

  private startLoop(): void {
    if (this.refreshInterval != undefined) {
      throw new Error("Loop already started");
    }
    this._firstRefresh = true;
    this.syncDisabledByPeriodPolicy = false;
    this.syncDisabledByWifiPolicy = false;

    this.refresh().then(() => {
      this.refreshInterval = setInterval(() => {
        setTimeout(() => {
          this.refresh().then().catch((error: any) => {
            console.error(error);
          });
        }, 0);
      },this.refreshTimeoutMs);
    }).catch((error: any) => {
      console.error(error);
      this._refreshing = false;
    }); 
  }

  private stopLoop(): void {
    if (this.refreshInterval == undefined) {
      throw new Error("Loop already stopped");
    }

    clearInterval(this.refreshInterval);

    this.refreshInterval = undefined;
    this._refreshing = false;
    this._daemonRunning = false;
  }

  private get tooEarlyForRefresh(): boolean {
    return Date.now() - this._lastRefresh <= this.refreshTimeoutMs;
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
      this._minerDataCoreBusyError = false;
    }
    catch (error) {
      console.error(error);

      if (error instanceof CoreIsBusyError) {
        this._minerDataCoreBusyError = true;
      }
      else {
        this._minerDataCoreBusyError = false;
      }
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

  public batteryLevel: number = 0;

  public syncDisabledByWifiPolicy: boolean = false;
  public syncDisabledByPeriodPolicy: boolean = false;

  private osType?: { platform: string };

  private async refresh(): Promise<void> {
    if (this.refreshing || this.tooEarlyForRefresh || this.daemonService.stopping || !this._daemonRunning) {
      return;
    }

    if (this.osType === undefined) {
      this.osType = await this.electronService.getOsType();
    }

    if (this._runningOnBattery === undefined || this.osType.platform == 'linux') {
      this._runningOnBattery = await this.electronService.isOnBatteryPower();
    }

    this._refreshing = true;

    try {
      const settings = await this.daemonService.getSettings(false);

      if (this._runningOnBattery && !settings.runOnBattery) {
        await this.daemonService.stopDaemon();
        return;
      }
      else if (this._runningOnBattery && settings.batteryLevelThreshold > 0) {
        const batteryLevel = await this.electronService.getBatteryLevel();
        
        if (batteryLevel <= settings.batteryLevelThreshold) {
          await this.daemonService.stopDaemon();
          return;
        }

        this.batteryLevel = batteryLevel;
      }

      const syncAlreadyDisabled = this.daemonService.settings.noSync;
  
      if (!settings.noSync && !syncAlreadyDisabled && !settings.syncOnWifi) {
        const wifiConnected = await this.electronService.isWifiConnected();
  
        if (wifiConnected) {
          console.log("Disabling sync ...");
          await this.daemonService.disableSync();
          this.syncDisabledByWifiPolicy = true;
        }
      }
      else if (!settings.noSync && syncAlreadyDisabled && !settings.syncOnWifi) {
        const wifiConnected = await this.electronService.isWifiConnected();
  
        if (!wifiConnected) {
          console.log("Enabling sync ...");
  
          await this.daemonService.enableSync();
          this.syncDisabledByWifiPolicy = false;
        }
        else {
          this.syncDisabledByWifiPolicy = true;
        }
      }
      else {
        this.syncDisabledByWifiPolicy = false;
      }
  
      if (!syncAlreadyDisabled && !this.syncDisabledByWifiPolicy && !this.syncDisabledByPeriodPolicy && settings.syncPeriodEnabled && !TimeUtils.isInTimeRange(settings.syncPeriodFrom, settings.syncPeriodTo)) {
        await this.daemonService.disableSync();
        this.syncDisabledByPeriodPolicy = true;
      }
      else if (syncAlreadyDisabled && !this.syncDisabledByWifiPolicy && this.syncDisabledByPeriodPolicy && settings.syncPeriodEnabled && TimeUtils.isInTimeRange(settings.syncPeriodFrom, settings.syncPeriodTo)) {
        await this.daemonService.enableSync();
        this.syncDisabledByPeriodPolicy = false;
      }
      else if (syncAlreadyDisabled && !this.syncDisabledByWifiPolicy && settings.syncPeriodEnabled && !TimeUtils.isInTimeRange(settings.syncPeriodFrom, settings.syncPeriodTo)) {
        this.syncDisabledByPeriodPolicy = true;
      }
      else {
        this.syncDisabledByPeriodPolicy = false;
      }
    }
    catch(error: any) {
      console.error(error);
    }
    
    this.syncStart.emit({ first: this._firstRefresh });

    try {
      this._daemonRunning = await this.daemonService.isRunning();
      const firstRefresh = this._firstRefresh;
      this._firstRefresh = false;

      if (!this._daemonRunning) {
        if (this.refreshInterval) this.stopLoop();
        this.syncEnd.emit();
        return;
      }

      await this.refreshProcessStats();

      if (firstRefresh) {
        this._gettingIsBlockchainPruned = true;

        const settings = await this.daemonService.getSettings();
        this._isBlockchainPruned = settings.pruneBlockchain;
  
        this._gettingIsBlockchainPruned = false;
      }

      this._gettingDaemonInfo = true;
      this._daemonInfo = await this.daemonService.getInfo();
      this._gettingDaemonInfo = false;

      if (this._daemonInfo.synchronized) {
        this._hashRateHistory.add(this._daemonInfo.gigaHashRate);
      }

      if (this.daemonService.settings.upgradeAutomatically && this._daemonInfo.updateAvailable) {
        const updateInfo = await this.daemonService.checkUpdate()
  
        if (updateInfo.update) {
          await this.daemonService.upgrade();
          return;
        }
      }

      this._gettingSyncInfo = true;
      this.syncInfoRefreshStart.emit();
      this._syncInfo = await this.daemonService.syncInfo();
      this._gettingSyncInfo = false;
      this.syncInfoRefreshEnd.emit();

      this._gettingBlockCount = true;
      this._blockCount = await this.daemonService.getBlockCount();
      this._gettingBlockCount = false;

      if (this._daemonInfo.synchronized) {
        this._gettingLastBlockHeader = true;
        this._lastBlockHeader = await this.daemonService.getLastBlockHeader(true);
        this._gettingLastBlockHeader = false;
      }

      if (this._daemonInfo.synchronized && this._daemonInfo.altBlocksCount > 0) await this.refreshAltChains();

      this._gettingNetStats = true;
      this.netStatsRefreshStart.emit();
      this._netStats = await this.daemonService.getNetStats();
      this._netStatsHistory.add(this._netStats);
      this.netStatsRefreshEnd.emit();
      this._gettingNetStats = false;

      if (this._daemonInfo.coreSynchronized) {
        await this.refreshMiningStatus();
        await this.refreshMinerData();
      }

      if (this._daemonInfo.synchronized && this._daemonInfo.txPoolSize > 0) {
        this._gettingTransactionPool = true;
        this._transactionPool = await this.daemonService.getTransactionPool();
        this._gettingTransactionPool = false;
      }
      else if (this._daemonInfo.txPoolSize == 0 && this._transactionPool != undefined) {
        this._transactionPool = undefined;
      }

      if (this._daemonInfo.synchronized && this._daemonInfo.txPoolSize > 0) {
        this._gettingTxPoolStats = true;
        this._txPoolStats = await this.daemonService.getTransactionPoolStats();
        this._gettingTxPoolStats = false;
      }
      else {
        this._txPoolStats = undefined;
      }

      this._lastRefresh = Date.now();
    } catch(error: any) {
      console.error(error);
      this._gettingDaemonInfo = false;
      this._gettingSyncInfo = false;
      this._gettingBlockCount = false;
      this._gettingLastBlockHeader = false;
      this._gettingIsBlockchainPruned = false;
      this._gettingAltChains = false;
      this._gettingNetStats = false;
      this._gettingTransactionPool = false;
      this._gettingTxPoolStats = false;

      this.syncError.emit(error);

      if (!await this.daemonService.isRunning()) {
        if (this.refreshInterval) this.stopLoop();
      }
    }

    this.syncEnd.emit();
    this._firstRefresh = false;
    this._refreshing = false;
  }

  private async refreshProcessStats(): Promise<void> {
    this._gettingProcessStats = true;

    try {
      this._processStats = await this.daemonService.getProcessStats();
    }
    catch(error: any) {
      console.error(error);
      this._processStats = undefined;
    }

    this._gettingProcessStats = false;
  }

}
