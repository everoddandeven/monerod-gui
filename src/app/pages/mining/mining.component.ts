import { AfterContentInit, AfterViewInit, Component, NgZone, OnDestroy, inject } from '@angular/core';
import { DaemonService, DaemonDataService, ElectronService } from '../../core/services';
import { NavbarPill } from '../../shared/components';
import { AddedAuxPow, AuxPoW, BlockTemplate, GeneratedBlocks, MiningStatus, MinerData, NetHashRateHistoryEntry, P2PoolSettings } from '../../../common';
import { BasePageComponent } from '../base-page/base-page.component';
import { Chart, ChartData } from 'chart.js';
import { Subscription } from 'rxjs';
import { P2poolService } from '../../core/services/p2pool/p2pool.service';
import { LogsService } from '../logs/logs.service';

type ToolsTab = 'generateBlocks' | 'getBlockTemplate' | 'calculatePoW' | 'addAuxPoW';
type MiningType = 'solo-mining' | 'p2pool-main' | 'p2pool-mini';
type DashboardTab = 'overview' | 'p2pool';

@Component({
    selector: 'app-mining',
    templateUrl: './mining.component.html',
    styleUrl: './mining.component.scss',
    standalone: false
})
export class MiningComponent extends BasePageComponent implements AfterViewInit, AfterContentInit, OnDestroy {
  
  // #region Attributes
  
  private readonly daemonService = inject(DaemonService);
  private readonly daemonData = inject(DaemonDataService);
  private readonly p2poolService = inject(P2poolService);
  private readonly logsService = inject(LogsService);
  private readonly electronService = inject(ElectronService);
  private readonly ngZone = inject(NgZone);

  private netHashRateChart?: Chart;
  private hashRateChart?: Chart;
  private netDifficultyChart?: Chart;

  public currentToolsTab: ToolsTab = 'generateBlocks';
  public currentDashboardTab: DashboardTab = 'overview';

  public gettingBlockTemplate: boolean = false;
  public getBlockTemplateAddress: string = '';
  public getBlockTemplateReserveSize: number = 0;
  public getBlockTemplateError: string = '';

  public blockTemplate?: BlockTemplate;
  
  public gettingCalcPow: boolean = false;
  public calcPowBlobData: string = '';
  public calcPowMajorVersion: number = 0;
  public calcPowHeight: number = 0;
  public calcPowSeed: string = '';
  public calcPowError: string = '';
  public calculatedPowHash: string = '';

  public generatedBlocks?: GeneratedBlocks;
  public generatingBlocks: boolean = false;
  public generateBlocksError: string = '';
  public generateBlocksAmountOfBlocks: number = 0;
  public generateBlocksAddress: string = '';
  public generateBlockPrevBlock: string = '';
  public generateStartingNonce: number = 0;

  public startMiningDoBackgroundMining: boolean = false;
  public startMiningIgnoreBattery: boolean = false;
  public startMiningMinerAddress: string = '';
  public startMiningThreadsCount: number = 0;
  public startingMining: boolean = false;
  public startMiningSuccess: boolean = false;
  public startMiningError: string = '';
  public startMiningType: MiningType = 'solo-mining';
  public startMiningLightMode: boolean = false;

  public stoppingMining: boolean = false;
  public stopMiningError: string = '';
  public stopMiningSuccess: boolean = false;

  public addAuxPowAuxPowJsonString: string = '';
  public addAuxPowBlockTemplateBlob: string = '';
  public addingAuxPow: boolean = false;
  public addAuxPowSuccess: boolean = false;
  public addAuxPowError: string = '';
  public addAuxPowResult?: AddedAuxPow;

  private scrollEventsRegistered: boolean = false;
  private initingLogs: boolean = false;
  private readonly scrollHandler: (ev: Event) => void = (ev: Event) => {
    this.scrolling = ev.type === 'scroll';
  };
  public scrolling: boolean = false;

  // #endregion

  // #region Getters

  public get maxThreadsCount(): number {
    return this.electronService.osDetails.cpus.length;
  }

  public get estimatedDailyIncome(): string {
    const d = this.miningStatus;
    const e = this.minerData;
    const i = this.daemonData.info;

    if (!d || !d.active) return "0 XMR";
    if (!e || !i) return "Calculating ...";

    const hashrate = d.speed;
    const netHashrate = i.hashRate;
    if (netHashrate === 0) return "Very Much XMR";
    const reward = d.blockReward;

    const income = (hashrate * reward * 720) / netHashrate;

    return `${(income / 1e12).toFixed(12)} XMR`;
  }

  public get timeToFindBlock(): string {
    const d = this.miningStatus;
    if (!d || d.speed === 0) return "never";
    const hashrate = d.speed;
    const difficulty = d.difficulty;
    const seconds = parseInt(`${ difficulty / hashrate}`);
    const minutes = parseInt(`${seconds / 60}`);
    const hours = parseInt(`${minutes / 60}`);
    const days = parseInt(`${hours / 24}`);
    const weeks = parseInt(`${days / 7}`);
    const months = parseInt(`${days / 30}`);
    const years = parseInt(`${days / 365}`);
    
    if (years > 0) return `${years} years`;
    if (months > 0) return `${months} months`;
    if (weeks > 0) return `${weeks} weeks`;
    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    if (minutes > 0) return `${minutes} minutes`;
    return `${seconds} seconds`;
  }

  public get p2poolTimeToFindBlock(): string {
    const poolStats = this.p2poolService.poolStats;
    const netStats = this.p2poolService.networkStat;
    if (!poolStats || !netStats) return "unknown";
    const d = { difficulty: netStats.difficulty, speed: poolStats.hashrate };
    if (!d || d.speed === 0) return "never";
    const hashrate = d.speed;
    const difficulty = d.difficulty;
    const seconds = parseInt(`${ difficulty / hashrate}`);
    const minutes = parseInt(`${seconds / 60}`);
    const hours = parseInt(`${minutes / 60}`);
    const days = parseInt(`${hours / 24}`);
    const weeks = parseInt(`${days / 7}`);
    const months = parseInt(`${days / 30}`);
    const years = parseInt(`${days / 365}`);
    
    if (years > 0) return `${years} years`;
    if (months > 0) return `${months} months`;
    if (weeks > 0) return `${weeks} weeks`;
    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    if (minutes > 0) return `${minutes} minutes`;
    return `${seconds} seconds`;
  }

  public get miningType(): string {
    if (this.stoppingMining) return 'none';
    const d = this.miningStatus;
    if (!d || !d.active) return 'none';
    return !this.p2poolService.running ? 'solo-mining' : this.startMiningType === 'p2pool-main' ? 'P2Pool (main)' : 'P2Pool (mini)';
  }

  public get majorVersion(): number {
    return this.minerData ? this.minerData.majorVersion : 0;
  }

  public get height(): number {
    return this.minerData ? this.minerData.height : 0;
  }

  public get prevId(): string {
    return this.minerData ? this.minerData.prevId : '';
  }

  public get networkHashRate(): string {
    const info = this.daemonData.info;

    if (!info) {
      return "0 GH/s";
    }

    const origGHs = parseFloat(info.gigaHashRate.toFixed(2));
    const origMHs = parseFloat(info.megaHashRate.toFixed(2));
    const origKHs = parseFloat(info.kiloHashRate.toFixed(2));
    const origHs = parseFloat(info.hashRate.toFixed(2));

    if (origGHs >= 1) {
      return `${origGHs} GH/s`;
    }
    else if (origMHs >= 1) {
      return `${origMHs} MH/s`;
    }
    else if (origKHs >= 1) {
      return `${origKHs} KH/s`;
    }
    else if (origHs >= 1) {
      return `${origHs} H/s`;
    }

    return "0 GH/s";
  }

  public get coreBusy(): boolean {
    return this.daemonData.info? !this.daemonData.info.coreSynchronized : true;
  }

  public get synchronized(): boolean {
    return this.daemonData.info ? this.daemonData.info.synchronized : false;
  }

  public get miningStatus(): MiningStatus | undefined {
    return this.daemonData.miningStatus;
  }

  public get minerData(): MinerData | undefined {
    return this.daemonData.minerData;
  }

  public get miningStatusLoading(): boolean
  {
    return this.startMiningSuccess && !this.miningStatus;
  }

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonService.stopping || this.daemonService.quitting;
  }

  public get validStartMiningMinerAddress(): boolean {
    return this.startMiningMinerAddress != '';
  }

  public get validAuxPowArray(): boolean {
    try {
      const auxPowArray: any[] = JSON.parse(this.addAuxPowAuxPowJsonString);

      if (!Array.isArray(auxPowArray) || auxPowArray.length == 0) {
        return false;
      }

      auxPowArray.forEach((auxPow: any) => AuxPoW.parse(auxPow));

      return true;
    }
    catch {
      return false;
    }
  }

  public get auxPowArray(): AuxPoW[] {
    if (!this.validAuxPowArray) {
      return [];
    }
    
    const _auxPowArray: any[] = JSON.parse(this.addAuxPowAuxPowJsonString);

    const auxPowArray: AuxPoW[] = [];

    _auxPowArray.forEach((auxPow: any) => auxPowArray.push(AuxPoW.parse(auxPow)));

    return auxPowArray;
  }

  public get miningState(): string {
    if (this.miningStatusLoading) return "Loading ...";
    const d = this.miningStatus;

    if (!d) return "disabled";
    
    if (this.startingMining) return "starting ..."

    return d.active ? 'mining ...' : 'not mining';
  }

  public get powAlgorithm(): string {
    const d = this.miningStatus;
    if (!d) return "RandomX";
    return d.powAlgorithm;
  }

  public get miningHeight(): number {
    const d = this.minerData;
    return d ? d.height : 0;
  }

  public get miningForkVersion(): string {
    const d = this.minerData;
    if (!d) return "unknown";
    return d.majorVersion.toString();
  }

  public get miningMedBlockWeight(): number {
    const d = this.minerData;
    return d ? d.medianWeight : 0;
  }

  public get miningDifficulty(): number {
    const d = this.miningStatus;
    if (!d) return 0;
    return d.difficulty;
  }

  public get miningMintedCoins(): string {
    const d = this.minerData;
    if (!d) return '0 XMR';
    return `${(d.alreadyGeneratedCoins / 1e12).toFixed(2)} XMR`;
  }

  public get miningSpeed(): string {
    const d = this.miningStatus;
    if (!d) return "0 H/s";
    return `${d.speed} H/s`;
  }

  public get miningThreadsCount(): number {
    const d = this.miningStatus;
    return d ? d.threadsCount : 0;
  }

  public get miningBlockReward(): string {
    const i = this.daemonData.lastBlockHeader;
    if (i) return `${i.rewardXMR} XMR`;
    const d = this.miningStatus;
    return d ? `${(d.blockReward / 1e12).toFixed(6)} XMR` : '0 XMR';
  }

  public get miningBlockTarget(): number {
    const d = this.miningStatus;
    return d ? d.blockTarget : 0;
  }

  public get miningBgEnabled(): string {
    const d = this.miningStatus;
    if (!d) return "disabled";
    return d.isBackgroundMiningEnabled ? "enabled" : "disabled";
  }

  public get miningBgIdleThreshold(): string {
    const d = this.miningStatus;
    if (!d) return "0 %";
    return `${d.bgIdleThreshold} %`;
  }

  public get miningBgMinIdleSeconds(): number {
    const d = this.miningStatus;
    if (!d) return 0;
    return d.bgMinIdleSeconds;
  }

  public get miningBgTarget(): number {
    const d = this.miningStatus;
    if (!d) return 0;
    return d.bgTarget;
  }

  // P2Pool

  public get p2poolState(): string {
    const i = this.p2poolService.settings;
    if (i.path === '') return 'not installed';
    return this.p2poolService.status;
  }

  public get p2poolPool(): string {
    return this.p2poolService.pool;
  }

  public get p2poolCurrentHashrate(): string {
    const i = this.p2poolService.minerStats;
    if (!i) return '0 H/s';
    if (i.GHashrate > 0.5) return `${i.GHashrate} GH/s`;
    if (i.MHashrate > 0.5) return `${i.MHashrate} MH/s`;
    if (i.KHashrate > 0.5) return `${i.KHashrate} KH/s`;
    return `${i.currentHashrate} H/s`;
  }

  public get p2poolTotalHashes(): string {
    const i = this.p2poolService.minerStats;
    return i ? `${i.totalHashes}` : '0';
  }

  public get p2poolSharesFound(): string {
    const i = this.p2poolService.minerStats;
    return i ? `${i.sharesFound}` : '0';
  }

  public get p2poolSharesFailed(): number {
    const i = this.p2poolService.minerStats;
    return i ? i.sharesFailed : 0;
  }

  public get p2poolRewardShare(): string {
    const i = this.p2poolService.minerStats;
    return i ? `${i.blockRewardSharePercent} %` : '0 %';
  }

  public get p2poolHashrate(): string {
    const i = this.p2poolService.poolStats;
    if (!i) return '0 H/s';
    if (i.GHashrate > 0.5) return `${i.GHashrate} GH/s`;
    if (i.MHashrate > 0.5) return `${i.MHashrate} MH/s`;
    if (i.KHashrate > 0.5) return `${i.KHashrate} KH/s`;
    return `${i.hashrate} H/s`;
  }

  public get p2poolSidechainDifficulty(): string {
    const i = this.p2poolService.poolStats;
    return i ? `${i.sidechainDifficulty}` : '0';
  }

  public get p2poolSidechainHeight(): string {
    const i = this.p2poolService.poolStats;
    return i ? `${i.sidechainHeight}` : '0';
  }

  public get p2poolMiners(): string {
    const i = this.p2poolService.poolStats;
    return i ? `${i.miners}` : '0';
  }

  public get p2poolPoolTotalHashes(): string {
    const i = this.p2poolService.poolStats;
    return i ? `${i.totalHashes}` : '0';
  }

  public get p2poolLastBlockFound(): number {
    const i = this.p2poolService.poolStats;
    return i ? i.lastBlockFound : 0;
  }

  public get p2poolTotalBlocksFound(): number {
    const i = this.p2poolService.poolStats;
    return i ? i.totalBlocksFound : 0;
  }

  public get p2poolPplnsWeight(): number {
    const i = this.p2poolService.poolStats;
    return i ? i.pplnsWeight : 0;
  }

  public get p2poolPplnsWindowSize(): number {
    const i = this.p2poolService.poolStats;
    return i ? i.pplnsWindowSize : 0;
  }
  
  public get p2poolHashrate15m(): string {
    const i = this.p2poolService.stratum;
    return i ? `${i.hashrate15m} H/s` : '0 H/s';
  }

  public get p2poolHashrate1h(): string {
    const i = this.p2poolService.stratum;
    return i ? `${i.hashrate1h} H/s` : '0 H/s';
  }

  public get p2poolHashrate24h(): string {
    const i = this.p2poolService.stratum;
    return i ? `${i.hashrate24h} H/s` : '0 H/s';
  }

  public get p2poolCurrentEffort(): string {
    const i = this.p2poolService.stratum;
    return i ? `${i.currentEffort}` : '0';
  }

  public get p2poolAverageEffort(): string {
    const i = this.p2poolService.stratum;
    return i ? `${i.averageEffort}` : '0';
  }

  // #region P2Pool

  public get p2poolLines(): string [] {
    return this.logsService.logs.p2pool;
  }

  public get p2poolLogs(): string {
    return this.initingLogs ? '' : this.p2poolLines.join("\n");
  }

  public get startingP2Pool(): boolean {
    return this.startMiningType === 'p2pool-main' || this.startMiningType === 'p2pool-mini';
  }

  // #endregion

  // #endregion

  constructor() {
    super();

    this.setLinks([
      new NavbarPill('mining-status', 'Status'),
      new NavbarPill('hashrate', 'Statistics'),
      new NavbarPill('mining-tools', 'Tools')
    ]);
    
    const onLogSub: Subscription = this.logsService.onLog.subscribe(({ type } : { message: string; type: 'monerod' | 'i2pd'; }) => {
      this.onLog(type);
    });

    const syncEndSub: Subscription = this.daemonData.syncEnd.subscribe(() => {
      this.refresh();
    });

    this.subscriptions.push(syncEndSub, onLogSub);
  }

  // #region Private Methods

  public scrollTablesContentToBottom(): void {
    this.scrollTableContentToBottom('pills-tabContent');
  }

  private initLogs(): void {
    this.initingLogs = true;  
    setTimeout(() => {
      this.registerScrollEvents();
      this.scrollTablesContentToBottom();
      this.initingLogs = false;
      
      setTimeout(() => {
        this.scrollTablesContentToBottom();
      }, 500);
    }, 500);  
  }

  private onLog(type: 'monerod' | 'p2pool' | 'i2pd' | 'tor'): void {
    if (type !== 'p2pool') return;
    if (this.scrolling) return;

    this.scrollTableContentToBottom(`${type}-log-table`);
  }

  private getTableContents(): HTMLElement[] {
    const table1 = document.getElementById('p2pool-log-table');
    const result: HTMLElement[] = [];

    if (table1) result.push(table1);

    return result;
  }

  private registerScrollEvents(): void {
    if (this.scrollEventsRegistered) {
      console.warn("Scroll events already registered");
      return;
    }

    const tabs = this.getTableContents();

    tabs.forEach((tab) => {
      tab.addEventListener('scroll', this.scrollHandler);
      tab.addEventListener('scrollend', this.scrollHandler);
    });

    this.scrollEventsRegistered = true;
  }

  private unregisterScrollEvents(): void {
    if (!this.scrollEventsRegistered) {
      console.warn("Scroll events already unregistered");
      return;
    }

    const tabs = this.getTableContents();

    tabs.forEach((tab) => {
      if (!tab) {
        console.warn("Coult not find table content");
        return;
      }
  
      tab.removeEventListener('scroll', this.scrollHandler);
      tab.removeEventListener('scrollend', this.scrollHandler);
    });

    this.scrollEventsRegistered = false;
  }

  private initNetHashRateChart(): void {
    this.initChart('netHashRateChart', this.buildNetHashRateData());
  }

  private initHashRateChart(): void {
    this.initChart('hashRateChart', this.buildHashRateData());
  }

  private initNetDifficultyChart(): void {
    this.initChart('netDifficultyChart', this.buildNetDifficultyData());
  }

  private initChart(chart: string, data: ChartData): void {
    setTimeout(() => {
      this.ngZone.run(() => {
        const ctx = <HTMLCanvasElement>document.getElementById(chart);
        
        if (!ctx) {
          console.warn("Could not find chart: " + chart);
          return;
        }

        const c = new Chart(ctx, {
          type: 'line',
          data: data,
          options: {
            animation: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                boxPadding: 3
              },
              decimation: {
                enabled: true,
                algorithm: 'min-max'
              }
            }
          }
        });

        if (chart === 'netHashRateChart') {
          this.netHashRateChart = c;
        } else if (chart === 'hashRateChart') {
          this.hashRateChart = c;
        } else if (chart === 'netDifficultyChart')
          this.netDifficultyChart = c;
      });
    }, 0);
  }

  private refreshNetHashRateHistory(): void {
    if (!this.synchronized) return;
    if (!this.netHashRateChart) this.initNetHashRateChart();
    if (!this.hashRateChart) this.initHashRateChart();
    if (!this.netDifficultyChart) this.initNetDifficultyChart();

    if (this.netHashRateChart) {
      const last = this.daemonData.netHashRateHistory.last;

      if (!last) {
        return;
      }

      const label = `${last.date.toLocaleDateString()} ${last.date.toLocaleTimeString()}`;

      this.netHashRateChart.data.labels?.push(label);
      this.netHashRateChart.data.datasets.forEach((dataset) => {
        dataset.data.push(last.gigaHashRate);
      });

      this.netHashRateChart.update();
    }

    if (this.hashRateChart) {
      const last = this.daemonData.hashRateHistory.last;

      if (!last) {
        return;
      }

      const label = `${last.date.toLocaleDateString()} ${last.date.toLocaleTimeString()}`;

      this.hashRateChart.data.labels?.push(label);
      this.hashRateChart.data.datasets.forEach((dataset) => {
        dataset.data.push(last.gigaHashRate);
      });

      this.hashRateChart.update();
    }

    if (this.netDifficultyChart) {
      const last = this.daemonData.netDifficultyHistory.last;

      if (!last) {
        return;
      }

      const label = `${last.date.toLocaleDateString()} ${last.date.toLocaleTimeString()}`;

      this.netDifficultyChart.data.labels?.push(label);
      this.netDifficultyChart.data.datasets.forEach((dataset) => {
        dataset.data.push(last.gigaHashRate);
      });

      this.netDifficultyChart.update();
    }
  }

  private buildNetHashRateData(): ChartData {
    const labels: string [] = [];
    const data: number[] = [];
    this.daemonData.netHashRateHistory.history.forEach((entry: NetHashRateHistoryEntry) => {
      labels.push(`${entry.date.toLocaleTimeString()} ${entry.date.toLocaleDateString()}`);
      data.push(entry.gigaHashRate);
    });

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'transparent',
        borderColor: '#ff5733',
        borderWidth: 4,
        pointBackgroundColor: '#ff5733',
        radius: 0
      }]
    };
  }

  private buildHashRateData(): ChartData {
    const labels: string [] = [];
    const data: number[] = [];
    this.daemonData.hashRateHistory.history.forEach((entry: NetHashRateHistoryEntry) => {
      labels.push(`${entry.date.toLocaleTimeString()} ${entry.date.toLocaleDateString()}`);
      data.push(entry.gigaHashRate);
    });

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'transparent',
        borderColor: '#33ff5fff',
        borderWidth: 4,
        pointBackgroundColor: '#33ff36ff',
        radius: 0
      }]
    };
  }

  private buildNetDifficultyData(): ChartData {
    const labels: string [] = [];
    const data: number[] = [];
    this.daemonData.netDifficultyHistory.history.forEach((entry: NetHashRateHistoryEntry) => {
      labels.push(`${entry.date.toLocaleTimeString()} ${entry.date.toLocaleDateString()}`);
      data.push(entry.gigaHashRate);
    });

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'transparent',
        borderColor: '#ff339cff',
        borderWidth: 4,
        pointBackgroundColor: '#ff3396ff',
        radius: 0
      }]
    };
  }

  private loadAuxPowTable(): void {
    this.loadTable('auxPowTable', this.addAuxPowResult ? this.addAuxPowResult.auxPoW : []);
  }

  private refresh(): void {
    this.refreshNetHashRateHistory();

    if (this.startingMining && this.miningStatus && this.miningStatus.active) {
      this.startingMining = false;
    }
  }

  private loadStartMiningParams(): void {
    const c = this.daemonService.settings;
    if (this.startMiningMinerAddress === '') this.startMiningMinerAddress = c.startMining;
    if (this.startMiningThreadsCount === 0) this.startMiningThreadsCount = c.miningThreads;
    this.startMiningDoBackgroundMining = c.bgMiningEnable;
    this.startMiningIgnoreBattery = c.bgMiningIgnoreBattery;
  }

  // #endregion

  // #region Public Methods

  // #region Angular Methods

  public ngAfterViewInit(): void {
    this.initNetHashRateChart();
    this.loadStartMiningParams();
    this.initLogs();
  }

  public override ngOnDestroy(): void {
    if (this.netHashRateChart) {
      this.netHashRateChart.destroy();
      this.netHashRateChart = undefined;
    }

    this.unregisterScrollEvents();
    super.ngOnDestroy();
  }

  // #endregion

  public clearP2PoolLogs(): void {
    this.logsService.clear('p2pool');
  }

  public async getBlockTemplate(): Promise<void> {
    this.gettingBlockTemplate = true;

    try {
      this.blockTemplate = await this.daemonService.getBlockTemplate(this.getBlockTemplateAddress, this.getBlockTemplateReserveSize);
      this.getBlockTemplateError = '';
    } catch(error: any) {
      this.getBlockTemplateError = `${error}`;
    }

    this.gettingBlockTemplate = false;
  }

  public async calcPowHash(): Promise<void> {
    this.gettingCalcPow = true;

    try {
      this.calculatedPowHash = await this.daemonService.calculatePoWHash(this.calcPowMajorVersion, this.calcPowHeight, this.calcPowBlobData, this.calcPowSeed)
    } catch(error: any) {
      this.calcPowError = `${error}`;
    }

    this.gettingCalcPow = false;
  }

  public async generateBlocks(): Promise<void> {
    this.generatingBlocks = true;

    try {
      this.generatedBlocks = await this.daemonService.generateBlocks(this.generateBlocksAmountOfBlocks, this.generateBlocksAddress, this.generateBlockPrevBlock, this.generateStartingNonce);
      this.generateBlocksError = '';
    }
    catch(error: any) {
      this.generateBlocksError = `${error}`;
    }

    this.generatingBlocks = false;
  }

  private async startP2PoolMining(): Promise<void> {
    const conf = this.daemonService.settings;

    if (conf.noZmq) throw new Error("P2Pool mining requires a monero ZMQ interface, enable it on node settings.");
    
    const p2poolConf = P2PoolSettings.fromDaemonSettings(conf);
    const type = this.startMiningType;

    if (type === 'p2pool-mini') {
      p2poolConf.mini = true;
    } else if (type === 'p2pool-main') {
      p2poolConf.nano = true;
    } else throw new Error("Invalid p2pool pool selected");

    if (this.startMiningLightMode) p2poolConf.lightMode = true;

    p2poolConf.path = this.p2poolService.settings.path;
    p2poolConf.startMining = this.startMiningThreadsCount;
    p2poolConf.wallet = this.startMiningMinerAddress;

    await this.p2poolService.start(p2poolConf);
    await this.daemonData.refreshMiningStatus();

    this.startingMining = false;
  }

  private async stopP2PoolMining(): Promise<void> {
    await this.p2poolService.stop();
  }

  public async startMining(): Promise<void> {
    try {
      if (this.startingMining) throw new Error("Mining already starting");
      this.startingMining = true;
      const miningType = this.startMiningType;
      
      if (miningType === 'solo-mining') {
        await this.daemonService.startMining(this.startMiningDoBackgroundMining, this.startMiningIgnoreBattery, this.startMiningMinerAddress, this.startMiningThreadsCount)
      } else {
        await this.startP2PoolMining();
      }

      this.startMiningError = '';
      this.startMiningSuccess = true;
    }
    catch(error: any) {
      this.startMiningSuccess = false;
      this.startMiningError = `${error}`.replaceAll('Error: ', '');
      this.startingMining = false;
    }
  }

  public async stopMining(): Promise<void> {
    this.stoppingMining = true;

    try {
      if (this.p2poolService.running) await this.stopP2PoolMining();
      else await this.daemonService.stopMining();

      this.stopMiningSuccess = true;
      this.stopMiningError = '';
    }
    catch(error: any) {
      console.error(error);
      this.stopMiningSuccess = false;
      this.stopMiningError = `${error};`
    }

    this.startMiningError = '';
    this.startMiningSuccess = false;
    this.stoppingMining = false;
  }

  public async addAuxPow(): Promise<void> {
    this.addingAuxPow = true;
    this.addAuxPowResult = undefined;

    try {
      this.addAuxPowResult = await this.daemonService.addAuxPoW(this.addAuxPowBlockTemplateBlob, this.auxPowArray);
      this.addAuxPowError = ``;
      this.addAuxPowSuccess = true;
      this.loadAuxPowTable();
    }
    catch (error: any) {
      this.addAuxPowSuccess = false;
      this.addAuxPowError = `${error}`;
    }

    this.addingAuxPow = false;
  }

  public setCurrentToolsTab(tab: ToolsTab): void {
    this.currentToolsTab = tab;
  }

  public setCurrentDashboardTab(tab: DashboardTab): void {
    this.currentDashboardTab = tab;
  }

  // #endregion

}
