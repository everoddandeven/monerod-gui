import { AfterViewInit, Component, NgZone } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { MinerData } from '../../../common/MinerData';
import { NavigationEnd, Router } from '@angular/router';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { Chain } from '../../../common/Chain';
import { AddedAuxPow, AuxPoW, BlockTemplate, GeneratedBlocks, MiningStatus } from '../../../common';
import { DaemonDataService } from '../../core/services';

@Component({
  selector: 'app-mining',
  templateUrl: './mining.component.html',
  styleUrl: './mining.component.scss'
})
export class MiningComponent implements AfterViewInit {

  public readonly navbarLinks: NavbarLink[];

  public get coreBusy(): boolean {
    return this.daemonData.info? !this.daemonData.info.synchronized : true;
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

  public get networkHashRate(): number {
    const origValue = this.daemonData.info ? this.daemonData.info.gigaHashRate : 0;
    
    return parseFloat(origValue.toFixed(2));
  }

  //private txBacklog: MineableTxBacklog[]
  public cards: Card[];

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

  constructor(private router: Router, private daemonService: DaemonService, private daemonData: DaemonDataService, private navbarService: NavbarService, private ngZone: NgZone) {
    this.cards = [];

    this.navbarLinks = [
      new NavbarLink('pills-mining-status-tab', '#pills-mining-status', 'mining-status', false, 'Status'),
      new NavbarLink('pills-miner-data-tab', '#pills-miner-data', 'miner-data', false, 'Miner Data'),
      new NavbarLink('pills-hashrate-tab', '#pills-hashrate', 'hashrate', false, 'Hashrate'),
      new NavbarLink('pills-alternate-chains-tab', '#pills-alternate-chains', 'alternate-chains', false, 'Alternate Chains'),
      new NavbarLink('pills-block-template-tab', '#pills-block-template', 'block-template', false, 'Block Template'),
      new NavbarLink('pills-generate-blocks-tab', '#pills-generate-blocks', 'generate-blocks', false, 'Generate Blocks'),
      new NavbarLink('pills-submit-block-tab', '#pills-submit-block', 'submit-block', false, 'Submit Block'),
      new NavbarLink('pills-calc-pow-tab', '#pills-calc-pow', 'calc-pow', false, 'Calculate PoW Hash'),
      new NavbarLink('pills-add-aux-pow-tab', '#pills-add-aux-pow', 'add-aux-pow', false, 'Add Aux PoW')
    ];

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url != '/mining') return;
        this.onNavigationEnd();
      }
    });
    
    this.daemonData.syncEnd.subscribe(() => {
      this.refresh();
    })
  }

  public ngAfterViewInit(): void {
    console.log('DetailComponent AFTER VIEW INIT');
    this.navbarService.setLinks(this.navbarLinks);

    setTimeout(() => {
      const options = {
        classes: 'table table-bordered table-hover table-dark table-striped'
      };

      const $chainsTable = $('#chainsTable');
      $chainsTable.bootstrapTable({});
      $chainsTable.bootstrapTable('refreshOptions', options);   
      
      this.refresh();

    }, 500);
  }

  public initAuxPowTable(): void {
    const options = {
      classes: 'table table-bordered table-hover table-dark table-striped'
    };
    const $auxPowTable = $('#auxPowTable');
    $auxPowTable.bootstrapTable({});
    $auxPowTable.bootstrapTable('refreshOptions', options);
    $auxPowTable.bootstrapTable('load', this.addAuxPowResult?.auxPoW);
  }

  private onNavigationEnd(): void {
    this.refresh();
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

    } catch (error) {
      return false;
    }
  }

  private refresh(): void {

    try {
      const $table = $('#chainsTable');
      $table.bootstrapTable('load', this.getChains());
      this.cards = this.createCards();
    }
    catch(error) {
      this.navbarService.disableLinks();
    }
    
  }

  private createCards(): Card[] {
    if (this.coreBusy) {
      return [
      ]
    }
    return [
      new Card('Major Fork Version', `${this.majorVersion}`),
      new Card('Current block height', `${this.height}`),
      new Card('Previous Block Id', `${this.prevId}`),
      new Card('Seed hash', `${this.seedHash}`),
      new Card('Network difficulty', `${this.difficulty}`),
      new Card('Median block weight', `${this.medianWeight}`),
      new Card('Generated Coins', `${this.alreadyGeneratedCoins}`)
    ];
  }

  private getChains(): any[] {
    const chains: any[] = [];

    this.alternateChains.forEach((chain: Chain) => chains.push({
      'blockHash': chain.blockHash,
      'height': chain.height,
      'length': chain.length,
      'mainChainParentBlock': chain.mainChainParentBlock,
      'wideDifficulty': chain.wideDifficulty
    }))

    return chains;
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
    }
    catch (error: any) {
      this.addAuxPowSuccess = false;
      this.addAuxPowError = `${error}`;
    }

    this.addingAuxPow = false;
  }

}

class Card {
  public header: string;
  public content: string;

  constructor(header: string, content: string) {
    this.header = header;
    this.content = content;
  }
}