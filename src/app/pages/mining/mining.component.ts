import { AfterContentInit, AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { DaemonService, DaemonDataService } from '../../core/services';
import { NavbarLink, NavbarService } from '../../shared/components';
import { AddedAuxPow, AuxPoW, BlockTemplate, GeneratedBlocks, MiningStatus, MinerData, Chain, NetHashRateHistoryEntry } from '../../../common';
import { BasePageComponent } from '../base-page/base-page.component';
import { SimpleBootstrapCard } from '../../shared/utils';
import { Chart, ChartData } from 'chart.js';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-mining',
    templateUrl: './mining.component.html',
    styleUrl: './mining.component.scss',
    standalone: false
})
export class MiningComponent extends BasePageComponent implements AfterViewInit, AfterContentInit, OnDestroy {

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

  public gettingBlockTemplate: boolean = false;
  public getBlockTemplateAddress: string = '';
  public getBlockTemplateReserveSize: number = 0;
  public getBlockTemplateError: string = '';

  public blockTemplate?: BlockTemplate;

  public submittingBlock: boolean = false;
  public submitBlockError: string = '';
  public submitBlockSuccess: boolean = false;
  public submitBlockBlobDataJsonString: string = '';
  public get modifiedSubmitBlockBlobData(): boolean {
    return this.submitBlockBlobDataJsonString != '';
  }
  
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

  public get majorVersion(): number {
    return this.minerData ? this.minerData.majorVersion : 0;
  }

  public get height(): number {
    return this.minerData ? this.minerData.height : 0;
  }

  public get prevId(): string {
    return this.minerData ? this.minerData.prevId : '';
  }

  private get seedHash(): string {
    return this.minerData ? this.minerData.seedHash : '';
  }

  private get difficulty(): number {
    return this.minerData ? this.minerData.difficulty : 0;
  }

  private get medianWeight(): number {
    return this.minerData ? this.minerData.medianWeight : 0;
  }

  private get alreadyGeneratedCoins(): number {
    return this.minerData ? this.minerData.alreadyGeneratedCoins : 0;
  }

  private get alternateChains(): Chain[] {
    return this.daemonData.altChains;
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

  private netHashRateChart?: Chart;

  //private txBacklog: MineableTxBacklog[]
  public cards: SimpleBootstrapCard[];

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }
  public get daemonStopping(): boolean {
    return this.daemonService.stopping;
  }

  public startMiningDoBackgroundMining: boolean = false;
  public startMiningIgnoreBattery: boolean = false;
  public startMiningMinerAddress: string = '';
  public startMiningThreadsCount: number = 0;
  public startingMining: boolean = false;
  public startMiningSuccess: boolean = false;
  public startMiningError: string = '';

  public stoppingMining: boolean = false;
  public stopMiningError: string = '';
  public stopMiningSuccess: boolean = false;

  public addAuxPowAuxPowJsonString: string = '';
  public addAuxPowBlockTemplateBlob: string = '';
  public addingAuxPow: boolean = false;
  public addAuxPowSuccess: boolean = false;
  public addAuxPowError: string = '';
  public addAuxPowResult?: AddedAuxPow;

  public get validStartMiningMinerAddress(): boolean {
    return this.startMiningMinerAddress != '';
  }

  constructor(private daemonService: DaemonService, private daemonData: DaemonDataService, navbarService: NavbarService, private ngZone: NgZone) {
    super(navbarService)
    this.cards = [];

    this.setLinks([
      new NavbarLink('pills-mining-status-tab', '#pills-mining-status', 'mining-status', false, 'Status'),
      new NavbarLink('pills-miner-data-tab', '#pills-miner-data', 'miner-data', false, 'Miner Data'),
      new NavbarLink('pills-hashrate-tab', '#pills-hashrate', 'hashrate', false, 'Hashrate'),
      new NavbarLink('pills-alternate-chains-tab', '#pills-alternate-chains', 'alternate-chains', false, 'Alternate Chains'),
      new NavbarLink('pills-block-template-tab', '#pills-block-template', 'block-template', false, 'Block Template'),
      new NavbarLink('pills-generate-blocks-tab', '#pills-generate-blocks', 'generate-blocks', false, 'Generate Blocks'),
      new NavbarLink('pills-submit-block-tab', '#pills-submit-block', 'submit-block', false, 'Submit Block'),
      new NavbarLink('pills-calc-pow-tab', '#pills-calc-pow', 'calc-pow', false, 'Calculate PoW Hash'),
      new NavbarLink('pills-add-aux-pow-tab', '#pills-add-aux-pow', 'add-aux-pow', false, 'Add Aux PoW')
    ]);
    
    const syncEndSub: Subscription = this.daemonData.syncEnd.subscribe(() => {
      this.refresh();
    });

    this.subscriptions.push(syncEndSub);
  }

  private initNetHashRateChart(): void {
    setTimeout(() => {
      this.ngZone.run(() => {
        const ctx = <HTMLCanvasElement>document.getElementById('netHashRateChart');
  
        if (!ctx) {
          console.warn("Could not find net hash rate chart");
          return;
        }
    
        this.netHashRateChart = new Chart(ctx, {
          type: 'line',
          data: this.buildNetHashRateData(),
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
      });
    }, 0);
  }

  private refreshNetHashRateHistory(): void {
    if (!this.synchronized) {
      return;
    }

    if (!this.netHashRateChart) {
      this.initNetHashRateChart();
    }

    if (!this.netHashRateChart) {
      console.warn("Net hash rate chart is not initiliazed");
      return;
    }

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

  public ngAfterViewInit(): void {
    this.loadTables();
    this.initNetHashRateChart();
  }

  public override ngAfterContentInit(): void {
    super.ngAfterContentInit();

    this.cards = this.createCards();
  }

  public override ngOnDestroy(): void {
    if (this.netHashRateChart) {
      this.netHashRateChart.destroy();
      this.netHashRateChart = undefined;
    }

    super.ngOnDestroy();
  }

  private loadTables(): void {
    this.loadChainsTable();
  }

  private loadChainsTable(): void {
    this.loadTable('chainsTable', this.alternateChains);
  }

  private loadAuxPowTable(): void {
    this.loadTable('auxPowTable', this.addAuxPowResult ? this.addAuxPowResult.auxPoW : []);
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

  public async submitBlock(): Promise<void> {
    if (!this.validBlobData()) {
      return;
    }

    this.submittingBlock = true;

    try {
      const blobData: string[] = JSON.parse(this.submitBlockBlobDataJsonString);
      await this.daemonService.submitBlock(...blobData);
      this.submitBlockError = '';
      this.submitBlockSuccess = true;
    }
    catch(error: any) {
      console.error(error);
      this.submitBlockError = `${error}`;
    }
    this.submittingBlock = false;
  }

  public validBlobData(): boolean {
    try {
      const parsed: any[] = JSON.parse(this.submitBlockBlobDataJsonString);

      if (!Array.isArray(parsed)) {
        throw new Error();
      }

      parsed.forEach((blob) => {
        if (typeof blob != 'string') {
          return false;
        }
      })

      return true;

    } catch {
      return false;
    }
  }

  private refresh(): void {
    this.loadChainsTable();
    this.refreshNetHashRateHistory();
    this.cards = this.createCards();
  }

  private createCards(): SimpleBootstrapCard[] {
    if (this.coreBusy) {
      return [
      ]
    }
    return [
      new SimpleBootstrapCard('Major Fork Version', `${this.majorVersion}`),
      new SimpleBootstrapCard('Current block height', `${this.height}`),
      new SimpleBootstrapCard('Previous Block Id', `${this.prevId}`),
      new SimpleBootstrapCard('Seed hash', `${this.seedHash}`),
      new SimpleBootstrapCard('Network difficulty', `${this.difficulty}`),
      new SimpleBootstrapCard('Median block weight', `${this.medianWeight}`),
      new SimpleBootstrapCard('Generated Coins', `${this.alreadyGeneratedCoins / 1e12} XMR`)
    ];
  }

  public async calcPowHash() {
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

  public async startMining(): Promise<void> {
    this.startingMining = true;
    try {
      await this.daemonService.startMining(this.startMiningDoBackgroundMining, this.startMiningIgnoreBattery, this.startMiningMinerAddress, this.startMiningThreadsCount)
      this.startMiningError = '';
      this.startMiningSuccess = true;
    }
    catch(error: any) {
      this.startMiningSuccess = false;
      this.startMiningError = `${error}`;
    }

    this.stopMiningError = '';
    this.stopMiningSuccess = false;
    this.startingMining = false;
  }

  public async stopMining(): Promise<void> {
    this.stoppingMining = true;

    try {
      await this.daemonService.stopMining();

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

}
