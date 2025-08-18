import { AfterViewInit, Component, inject, NgZone } from '@angular/core';
import { NavbarPill } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { Block, BlockDetails, BlockHeader, FeeEstimate, HistogramEntry, MinerTx, Output, OutputDistribution, SpentKeyImage, SyncInfo, TxBacklogEntry, TxPoolHisto, TxPoolStats, UnconfirmedTx } from '../../../common';
import { DaemonDataService } from '../../core/services';
import { BasePageComponent } from '../base-page/base-page.component';
import { Subscription } from 'rxjs';

type TxPoolTab = 'statistics' | 'transactions' | 'keyImages' | 'backlog' | 'flush';
type ExplorerTab = 'getBlock' | 'getTransaction' | 'getOuts' | 'checkKeyImage' | 'histogram' | 'distribution';
type ToolsTab = 'broadcast' | 'submitBlock' | 'bootstrap' | 'coinbaseSum' | 'popBlocks' | 'save' | 'prune' | 'cache';

@Component({
    selector: 'app-blockchain',
    templateUrl: './blockchain.component.html',
    styleUrl: './blockchain.component.scss',
    standalone: false
})
export class BlockchainComponent extends BasePageComponent implements AfterViewInit {
  // #region Attributes
  private daemonService = inject(DaemonService);
  private daemonData = inject(DaemonDataService);
  private ngZone = inject(NgZone);

  public fullBlock: boolean = false;
  public gotFullBlock: boolean = false;

  public block?: Block;
  public getBlockByHash: boolean = false;
  public getBlockHash: string = '';
  public getBlockHeight: number = 0;
  public fillPoWHash: boolean = false;
  public gettingLastBlock: boolean = false;

  public gettingBlock: boolean = false;
  public blockHeader?: BlockHeader;

  public getBlockError: string = '';

  public popBlocksNBlocks: number = 0;
  public poppingBlocks: boolean = false;
  public popBlocksError: string = '';
  public popBlocksResult?: number;

  public savingBlockchain: boolean = false;
  public saveBlockchainError: string = '';
  public blockchainSaved: boolean = false;

  public pruningBlockchain: boolean = false;
  public pruneBlockchainError: string = '';
  public blockchainPruned: boolean = false;

  public feeEstimate: FeeEstimate = new FeeEstimate(0, [], 0);
  public estimatingFee: boolean = false;

  public flushing: boolean = false;
  public flushSuccess: boolean = false;
  public flushError: string = '';
  public flushTxIdsJsonString: string = '';

  public getTxHash: string = '';
  public gettingTx: boolean = false;
  public getTxError: string = '';

  public clearingCache: boolean = false;
  public clearCacheError: string = '';
  public clearCacheSuccess: boolean = false;
  public clearBadTxs: boolean = false;
  public clearBadBlocks: boolean = false;

  public broadcasting: boolean = false;
  public broadcastByHash: boolean = false;
  public broadcastSuccess: boolean = false;
  public broadcastError: string = '';
  public rawTxJsonString: string = '';
  public txIdsJsonString: string = '';
  public sendRawTxDoNotRelay: boolean = false;

  public checkKeyImageError: string = '';
  public keyImage: string = '';
  public checkingKeyImage: boolean = false;
  public keyImageStatus: number = -1;

  public submittingBlock: boolean = false;
  public submitBlockError: string = '';
  public submitBlockSuccess: boolean = false;
  public submitBlockBlobDataJsonString: string = '';

  public coinbaseTxSumHeight: number = 0;
  public coinbaseTxSumCount: number = 0;
  public getCoinbaseTxSumSuccess: boolean = false;
  public getCoinbaseTxSumError: string = '';

  public getOutsJsonString: string = '';
  public getOutsGetTxId: boolean = false;
  public getOutsError: string = '';
  public getOutsSuccess: boolean = false;
  public gettingOuts: boolean = false;

  public get modifiedSubmitBlockBlobData(): boolean {
    return this.submitBlockBlobDataJsonString != '';
  }

  public getOutHistogramAmountsJsonString: string = '';
  public getOutHistogramMinCount: number = 0;
  public getOutHistogramMaxCount: number = 0;
  public getOutHistogramUnlocked: boolean = false;
  public getOutHistogramRecentCutoff: number = 0;
  public getOutHistogramResult?: HistogramEntry[];
  public getOutHistogramError: string = '';
  public gettingOutHistogram: boolean = false;

  public gettingOutDistribution: boolean = false;
  public getOutDistributionAmountsJsonString: string = '';
  public getOutDistributionFromHeight: number = 0;
  public getOutDistributionToHeight: number = 0;
  public getOutDistributionCumulative: boolean = false;
  public getOutDistributionResult?: OutputDistribution[];
  public getOutDistributionError: string = '';

  public currentPoolTab: TxPoolTab = 'statistics';
  public currentExplorerTab: ExplorerTab = 'getBlock';
  public currentToolsTab: ToolsTab = 'broadcast';

  // #endregion

  // #region Getters

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonData.stopping;
  }

  public get daemonStarting(): boolean {
    return this.daemonService.starting;
  }

  public get lastBlockHeader(): BlockHeader | undefined {
    return this.daemonData.lastBlockHeader;
  }

  public get daemonSynchronized(): boolean {
    return this.daemonData.info ? this.daemonData.info.synchronized : false;
  }

  public get getLastBlockError(): string {
    return this.daemonSynchronized ? '' : 'Last block header not available, blockchain is not synchronized';
  }

  public get syncInfo(): SyncInfo | undefined {
    return this.daemonData.syncInfo;
  }
  
  public get overviewArray(): string[] {
    return this.daemonData.syncInfo ? this.daemonData.syncInfo.overview.split('').filter((status: string) => status != '[' && status != ']') : [];
  }

  public get blockchainDataDir(): string {
    const dataDir = this.daemonService.settings.dataDir;

    if (dataDir === '') return '~/.bitmonero/';

    return dataDir;
  }

  private get startHeight(): number {
    return this.daemonService.startHeight;
  }

  public get syncState(): string {
    const info = this.daemonData.info;
    if (!info) return "Not syncing";
    if (info.synchronized) return "Synchronized";
    if (info.busySyncing) return "Syncing";
    return "Sync disabled";
  }

  public get syncProgress(): string {
    const startHeight = this.startHeight;
    const targetHeight = this.targetHeight;
    const height = this.height;
    const blocksLeft = targetHeight - startHeight;
    const blocksDone = targetHeight - height;
    const value = 100 - (blocksDone*100/blocksLeft);
    const progress = `${value.toFixed(2)} %`;
    
    if (height === targetHeight) {
      return "100 %"
    }

    return progress;
  }

  public get syncProgressTotal(): string {
    const targetHeight = this.targetHeight;
    const height = this.height;
    const value = (height*100/targetHeight);
    const progress = `${value.toFixed(2)} %`;
    
    if (height === targetHeight) {
      return "100 %"
    }

    return progress;
  }

  private get height(): number {
    return this.daemonData.syncInfo ? this.daemonData.syncInfo.height : 0;
  }

  public get heightWithoutBootstrap(): number {
    return this.daemonData.info ? this.daemonData.info.heightWithoutBootstrap : 0;
  }

  public get bootstrapEnabled(): string {
    const info = this.daemonData.info;
    if (info && info.bootstrapDaemonAddress != '') return info.bootstrapDaemonAddress;
    else if (info && info.bootstrapDaemonAddress == 'auto') return "Automatic";
    return "Disabled";
  }

  private get targetHeight(): number {
    const value = this.daemonData.syncInfo ? this.daemonData.syncInfo.targetHeight : 0;

    if (value == 0 && this.height > 0) {
      return this.height;
    }

    return value;
  }

  public get scanHeight(): string {
    const height = this.height;
    const targetHeight = this.targetHeight;
    return `${height} / ${targetHeight}`; 
  }

  public get fastBlockSync(): string {
    const i = this.daemonService.settings;
    return i.fastBlockSync ? 'enabled' : 'disabled';
  }

  public get syncPrunedBlocks(): string {
    const i = this.daemonService.settings;
    return i.syncPrunedBlocks ? 'enabled' : 'disabled';
  }

  public get capacity(): number {
    return this.daemonData.info ? this.daemonData.info.freeSpace + this.daemonData.info.databaseSize : 0;
  }

  public get diskUsage(): string {
    const value = this.daemonData.info ? parseFloat((this.daemonData.info.databaseSize * 100 / this.capacity).toFixed(2)) : 0;
    return `${value} %`;
  }

  public get blockchainSize(): string {
    const value = this.daemonData.info ? parseFloat((this.daemonData.info.databaseSize / 1024 / 1024 / 1024).toFixed(2)) : 0;
    return `${value} GB`;
  }

  public get blockCount(): number {
    return this.daemonData.blockCount ? this.daemonData.blockCount.count : 0;
  }

  public get nextNeededPruningSeed(): number {
    return this.syncInfo ? this.syncInfo.nextNeededPruningSeed : 0;
  }

  public get networkType(): string {
    return this.daemonData.info ? this.daemonData.info.nettype : 'unknown';
  }

  public get txCount(): number {
    return this.daemonData.info ? this.daemonData.info.txCount : 0;
  }

  public get poolSize(): number {
    return this.daemonData.info ? this.daemonData.info.txPoolSize : 0;
  }

  public get nodeType(): string {
    return this.daemonData.isBlockchainPruned ? 'pruned' : 'full';
  }

  public get hashRate(): string {
    const info = this.daemonData.info;

    if (!info) {
      return "??? GH/s";
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

  public get altChains(): number {
    return this.daemonData.info ? this.daemonData.info.altBlocksCount : 0;
  }

  public get txPoolStats(): TxPoolStats {
    if (this.daemonData.txPoolStats) {
      return this.daemonData.txPoolStats;
    }

    return new TxPoolStats(0, 0, 0, 0, 0, new TxPoolHisto(0, 0), 0, 0, 0, 0, 0, 0, 0)
  }

  public get txPoolBacklog(): TxBacklogEntry[] {
    return this.daemonData.txPoolBacklog;
  }

  private get unconfirmedTxs(): UnconfirmedTx[] {
    if (!this.daemonData.transactionPool) {
      return [];
    }

    return this.daemonData.transactionPool.transactions;
  }

  private get spentKeyImages(): SpentKeyImage[] {
    if (!this.daemonData.transactionPool) {
      return [];
    }

    return this.daemonData.transactionPool.spentKeyImages;
  }

  public get keyImagesTotal(): number {
    return this.spentKeyImages.length;
  }

  public get validFlushTxIds(): boolean {
    try {
      const txIds: any[] = JSON.parse(this.flushTxIdsJsonString);

      if (!Array.isArray(txIds) || txIds.length == 0) {
        return false;
      }

      let valid: boolean = true;

      txIds.forEach((txId: string) => {
        if (typeof txId != 'string' || txId == '') {
          valid = false;
        }
      });

      return valid;
    }
    catch {
      return false;
    }
  }

  private get flushTxIds(): string[] {
    if (!this.validFlushTxIds) {
      return [];
    }

    const txIds: string[] = JSON.parse(this.flushTxIdsJsonString);

    return txIds;
  }

  public get validTxIds(): boolean {
    try {
      const value: any[] = JSON.parse(this.txIdsJsonString);

      if(!Array.isArray(value)) {
        return false;
      }

      for(const txId of value) {
        if (typeof txId != 'string') {
          return false;
        }
      }

      return true;
    }
    catch {
      return false;
    }
  }

  public get modifiedTxIds(): boolean {
    return this.txIdsJsonString != '';
  }

  public get alreadyGeneratedCoins(): string {
    const minerData = this.daemonData.minerData;

    if (!minerData) {
      if (this.daemonData.running) return "Loading ...";
      else return "??? XMR";
    }

    return `${(minerData.alreadyGeneratedCoins / 1e12).toFixed(2)} XMR`;
  }

  public get inPeers(): number {
    const info = this.daemonData.syncInfo;

    if (!info) return 0;

    return info.peers.length;
  }

  public get outPeers(): number {
    const info = this.daemonData.syncInfo;

    if (!info) return 0;

    return info.spans.length;
  }

  public get inOutPeers(): string {
    return `${this.inPeers} / ${this.outPeers}`;
  }

  public get getOutsOuts(): Output[] {
    try {
      const _outs: any[] = JSON.parse(this.getOutsJsonString);
      const outs: Output[] = [];

      _outs.forEach((_out) => outs.push(Output.parse(_out)));

      return outs;
    }
    catch {
      return []
    }
  }

  public get validOuts(): boolean {
    try {
      const _outs: any[] = JSON.parse(this.getOutsJsonString);

      if (!Array.isArray(_outs)) {
        return false;
      }

      if (_outs.length == 0) {
        return false;
      }

      _outs.forEach((_out) => Output.parse(_out));

      return true;
    } catch {
      return false;
    }
  }

  public get validOutDistributionAmounts(): boolean {
    try {
      const amounts: number[] = JSON.parse(this.getOutDistributionAmountsJsonString);

      if(!Array.isArray(amounts)) {
        return false;
      }

      amounts.forEach((amount) => {
        if (typeof amount != 'number' || amount <= 0) throw new Error("");
      })

      return true;
    }
    catch {
      return false;
    }
  }

  public get validOutHistogramAmounts(): boolean {
    try {
      const amounts: number[] = JSON.parse(this.getOutHistogramAmountsJsonString);

      if(!Array.isArray(amounts)) {
        return false;
      }

      amounts.forEach((amount) => {
        if (typeof amount != 'number' || amount <= 0) throw new Error("");
      })

      return true;
    }
    catch {
      return false;
    }
  }

  public get getOutHistogramAmounts(): number[] {
    if (!this.validOutHistogramAmounts) {
      return [];
    }

    return <number[]>JSON.parse(this.getOutHistogramAmountsJsonString);
  }

  public get getOutDistributionAmounts(): number[] {
    if (!this.validOutDistributionAmounts) {
      return [];
    }

    return <number[]>JSON.parse(this.getOutDistributionAmountsJsonString);
  }

  // #endregion

  constructor() {
    super();
    this.setLinks([
      new NavbarPill('blockchain-info', 'Info', true),
      new NavbarPill('explorer', 'Explorer'),
      new NavbarPill('tx-pool', 'Pool'),
      new NavbarPill('blockchain-tools', 'Tools')
    ]);

    this.registerEvents();
  }

  // #region Private Methods

  private registerEvents(): void {
    this.subscriptions.push(this.daemonData.syncEnd.subscribe(() => this.onRefresh()));
  }

  private onRefresh(): void {
    setTimeout(() => {
      this.enableToolTips();
      this.estimateFee().then().catch((error: any) => console.error(error));
    }, 350);
  }

  private refresh(): void {
    this.loadTables();
  }

  private async estimateFee(): Promise<void> {
    if (this.estimatingFee) return;
    this.estimatingFee = true;

    try {
      this.feeEstimate = await this.daemonService.getFeeEstimate();
    } catch (error: any) {
      console.error(error);
    }

    this.estimatingFee = false;
  }

  private loadTransactionsTable(): void {
    this.loadTable('transactionsTable', this.unconfirmedTxs);
  }

  private loadSpentKeyImagesTable(): void {
    this.loadTable('spentKeyImagesTable', this.spentKeyImages);
  }

  private loadTxPoolBacklogTable(): void {
    this.loadTable('txPoolBacklogTable', this.txPoolBacklog);
  }

  private loadOutDistributionTable(): void {
    this.loadTable('outDistributionsTable', this.getOutDistributionResult ? this.getOutDistributionResult : []);
  }

  private loadOutHistogramTable(): void {
    this.loadTable('outHistogramsTable', this.getOutHistogramResult ? this.getOutHistogramResult : []);
  }

  private loadTables(): void {
    this.loadSpentKeyImagesTable();
    this.loadTransactionsTable();
    this.loadTxPoolBacklogTable();
  }

  // #endregion

  // #region Public Methods

  public ngAfterViewInit(): void {
    this.ngZone.run(() => {      
      this.loadTables();

      const onSyncEndSub: Subscription = this.daemonData.syncEnd.subscribe(() => this.refresh());

      const statusSub: Subscription = this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
        if (running) {
          this.loadTables();
        }
        else {
          this.destroyTables();
        }
      });

      this.subscriptions.push(onSyncEndSub, statusSub);
    });
  }

  public getBlockClass(block: string): string {
    switch (block) {
      case '.':
        return 'requested';
      case 'o':
        return 'received';
      case 'm':
        return 'matched';
      case '<':
        return 'target';
      case '_':
        return 'future';
      default:
        return '';
    }
  }

  public getBlockTooltip(block: string): string {
    switch (block) {
      case '.':
        return 'Set requested but not received';
      case 'o':
        return 'Set received';
      case 'm':
        return 'Received set that matches the next blocks needed';
      case '<':
        return 'Needed set in order to continue synchronization';
      case '_':
        return 'Set beyond current sync height';
      default:
        return '';
    }
  }

  public async getTx(): Promise<void> {
    if (this.gettingTx) return;

    this.gettingTx = true;

    try {
      throw new Error("Not implemented");
      // TODO implement getTx()
      //const txs = await this.daemonService.getTransactions([this.getTxHash]);      
      //if (txs.length === 0) throw new Error("No transaction found");
      //this.tx = txs[0];
      
      //this.getTxError = '';
    } catch (error: any) {
      console.error(error);
      this.getTxError = `${error}`;
    }

    this.gettingTx = false;
  }

  public async getBlock(): Promise<void> {
    this.gettingBlock = true;
    try {
      if (this.fullBlock) this.block = await this.daemonService.getBlock(this.getBlockByHash ? this.getBlockHash : this.getBlockHeight, this.fillPoWHash);
      else {
        await this.getBlockHeader();
        const header = this.blockHeader;
        if (!header) throw new Error("Could not get block header");
        this.block = new Block('', header, new BlockDetails(0, 0, 0, '', 0, new MinerTx(0, 0, [], [], []), []));
      }

      this.gotFullBlock = this.fullBlock;
      this.getBlockError = '';
    }
    catch(error: any) {
      console.error(error);
      this.gotFullBlock = false;
      this.getBlockError = `${error}`;
    }

    this.gettingBlock = false;

  }

  public async getBlockHeader(): Promise<void> {
    this.gettingBlock = true;

    try {
      if (this.getBlockByHash) {
        this.blockHeader = await this.daemonService.getBlockHeaderByHash(this.getBlockHash, this.fillPoWHash);
      }
      else {
        this.blockHeader = await this.daemonService.getBlockHeaderByHeight(this.getBlockHeight, this.fillPoWHash);
      }
      
      this.getBlockError = '';
    } catch (error: any) {
      console.error(error);
      this.getBlockError = `${error}`;
    }

    this.gettingBlock = false;
  }

  public async popBlocks(): Promise<void> {
    this.poppingBlocks = true;
    try {
      this.popBlocksResult = await this.daemonService.popBlocks(this.popBlocksNBlocks);
      this.popBlocksError = '';
    }
    catch(error: any) {
      console.error(error);
      this.popBlocksResult = undefined;
      this.popBlocksError = `${error}`;
    }
    this.poppingBlocks = false;
  }

  public async saveBlockchain(): Promise<void> {
    this.savingBlockchain = true;

    try {
      await this.daemonService.saveBc();
      this.blockchainSaved = true;
    }
    catch(error: any) {
      console.error(error);
      this.blockchainSaved = false;
      this.saveBlockchainError = `${error}`;
    }

    this.savingBlockchain = false;
  }

  public async pruneBlockchain(): Promise<void> {
    this.pruningBlockchain = true;

    try {
      await this.daemonService.pruneBlockchain(false);
      this.blockchainPruned = true;
    } catch(error: any) {
      this.pruneBlockchainError = `${error}`;
      this.blockchainPruned = false;
    }

    this.pruningBlockchain = false;
  }

  public async flush(): Promise<void> {
    this.flushing = true;

    try {
      await this.daemonService.flushTxPool(...this.flushTxIds);
      this.flushError = '';
      this.flushSuccess = true;
    }
    catch(error: any) {
      this.flushSuccess = false;
      this.flushError = `${error}`;
    }

    this.flushing = false;
  }

  public async clearCache(): Promise<void> {
    this.clearingCache = true;

    try {
      await this.daemonService.flushCache(this.clearBadTxs, this.clearBadBlocks);
      this.clearCacheError = '';
      this.clearCacheSuccess = true;
    }
    catch(error: any) {
      this.clearCacheSuccess = false;
      this.clearCacheError = `${error}`;
    }

    this.clearingCache = false;
  }

  private async sendTx(): Promise<void> {
    this.broadcasting = true;

    try {
      const info = await this.daemonService.sendRawTransaction(this.rawTxJsonString, this.sendRawTxDoNotRelay);
      
      if (info.doubleSpend) {
        throw new Error('Transaction is double spend');
      }
      else if (info.feeTooLow) {
        throw new Error('Fee is too low');
      }
      else if (info.invalidInput) {
        throw new Error('Input is invalid');
      }
      else if (info.invalidOutput) {
        throw new Error('Output is invalid');
      }
      else if (info.lowMixin) {
        throw new Error('Mixin count is too low');
      }
      else if (info.overspend) {
        throw new Error('Transaction uses more money than available')
      }
      else if (info.tooBig) {
        throw new Error('Transaction size is too big');
      }
      this.broadcastSuccess = true;
      this.broadcastError = '';
    }
    catch(error: any) {
      this.broadcastError = `${error}`;
    }

    this.broadcasting = false;
  }

  private async relayTx(): Promise<void> {
    if (!this.validTxIds) {
      return;
    }

    this.broadcasting = true;

    const txIds: string[] = JSON.parse(this.txIdsJsonString);

    try {
      await this.daemonService.relayTx(...txIds);
      this.broadcastSuccess = true;
      this.broadcastError = '';
    }
    catch(error: any) {
      console.error(error);
      this.broadcastSuccess = false;
      this.broadcastError = `${error}`;
    }

    this.broadcasting = false;
  }

  public async broadcastTx(): Promise<void> {
    if (this.broadcastByHash) await this.relayTx();
    else await this.sendTx();
  }

  public async checkKeyImage(): Promise<void> {
    if (this.checkingKeyImage) return;
    this.checkingKeyImage = true;

    try {
      const result = await this.daemonService.isKeyImageSpent(this.keyImage);

      if (result.length === 0) throw new Error("Could not get key image from blockchain");

      this.keyImageStatus = result[0];
      this.checkKeyImageError = ``;
    } catch (error: any) {
      console.error(error);
      this.checkKeyImageError = `${error}`;
    }

    this.checkingKeyImage = false;
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

  public async onGetCoinbaseTxSum(): Promise<void> {
    try {
      throw new Error("Not implemented");
      //const coinbaseTxSum = await this.daemonService.getCoinbaseTxSum(this.coinbaseTxSumHeight, this.coinbaseTxSumCount);
      // TO DO Implement
      //this.getCoinbaseTxSumSuccess = true;
      //this.getCoinbaseTxSumError = '';
    }
    catch(error: any) {
      console.error(error);
      this.getCoinbaseTxSumSuccess = false;
      this.getCoinbaseTxSumError = `${error}`;
    }
  }

  public async getOuts(): Promise<void> {
    this.gettingOuts = true;

    try {
      const $table = $('#outsTable');
      $table.bootstrapTable({});
  
      const outs = await this.daemonService.getOuts(this.getOutsOuts, this.getOutsGetTxId); 
      $table.bootstrapTable('load', outs);

      this.getOutsError = '';
      this.getOutsSuccess = true;
    }
    catch(error: any) {
      console.error(error);
      this.getOutsError = `${error}`;
      this.getOutsSuccess = false;
    }

    this.gettingOuts = false;
  }

public async getOutDistribution(): Promise<void> {
    this.gettingOutDistribution = true;

    try 
    {
      const amounts = this.getOutDistributionAmounts;
      const cumulative = this.getOutDistributionCumulative;
      const fromHeight = this.getOutDistributionFromHeight;
      const toHeight = this.getOutDistributionToHeight;

      this.getOutDistributionResult = await this.daemonService.getOutputDistribution(amounts, cumulative, fromHeight, toHeight);
      this.loadOutDistributionTable();
      this.getOutDistributionError = '';
    }
    catch(error: any) {
      this.getOutDistributionError = `${error}`;
      this.getOutDistributionResult = undefined;
    }

    this.gettingOutDistribution = false;
  }

  public async getOutHistogram(): Promise<void> {
    this.gettingOutHistogram = true;

    try {
      this.getOutHistogramResult = await this.daemonService.getOutputHistogram(this.getOutHistogramAmounts, this.getOutHistogramMinCount, this.getOutHistogramMaxCount, this.getOutHistogramUnlocked, this.getOutHistogramRecentCutoff);
      this.getOutHistogramError = '';
      this.loadOutHistogramTable();
    }
    catch(error: any) {
      console.error(error);
      this.getOutHistogramError = `${error}`;
      this.getOutHistogramResult = undefined;
    }

    this.gettingOutHistogram = false;
  }

  public setCurrentPoolTab(tab: TxPoolTab): void {
    this.currentPoolTab = tab;
  }

  public setCurrentExplorerTab(tab: ExplorerTab): void {
    this.currentExplorerTab = tab;
  }

  public setCurrentToolsTab(tab: ToolsTab): void {
    this.currentToolsTab = tab;
  }

  // #endregion

  //#region Bootstrap Daemon 

  public settingBootstrapDaemon: boolean = false;
  public bootstrapDaemonAddress: string = '';
  public bootstrapDaemonUsername: string = '';
  public bootstrapDaemonPassword: string = '';
  public bootstrapDaemonProxy: string = '';
  public setBootstrapDaemonSuccess: boolean = false;
  public setBootstrapDaemonError: string = '';
  public removingBootstrapDaemon: boolean = false;
  public removeBootstrapDaemonSuccess: boolean = false;

  public get canRemoveBootstrapDaemon(): boolean {
    return this.daemonData.info ? this.daemonData.info.bootstrapDaemonAddress != '' : false;
  }

  private get wasBootstrapEverUsed(): boolean {
    return this.daemonData.info ? this.daemonData.info.wasBoostrapEverUsed : false;
  }

  private get _bootstrapDaemonAddress(): string {
    return this.daemonData.info && this.daemonData.info.bootstrapDaemonAddress != '' ? this.daemonData.info.bootstrapDaemonAddress : 'Not set';
  }

  public get canSetBootstrapDaemon(): boolean {
    if (this.settingBootstrapDaemon) {
      return false;
    }

    return this.bootstrapDaemonAddress != '';
  }

  public async setBootstrapDaemon(): Promise<void> {
    this.settingBootstrapDaemon = true;

    try {
      await this.daemonService.setBootstrapDaemon(this.bootstrapDaemonAddress, this.bootstrapDaemonUsername, this.bootstrapDaemonPassword, this.bootstrapDaemonProxy);
      this.setBootstrapDaemonError = '';
      this.setBootstrapDaemonSuccess = true;
    }
    catch(error: any) {
      this.setBootstrapDaemonSuccess = false;
      this.setBootstrapDaemonError = `${error}`;
    }

    this.settingBootstrapDaemon = false;
  }

  public async removeBootstrapDaemon(): Promise<void> {
    this.removingBootstrapDaemon = true;

    try {
      if (!this.canRemoveBootstrapDaemon) {
        throw new Error("Bootstrap daemon not set");
      }

      await this.daemonService.removeBootstrapDaemon();
      this.setBootstrapDaemonError = '';
      this.removeBootstrapDaemonSuccess = true;
    }

    catch(error: any) {
      console.error(error);

      if (error instanceof Error) {
        this.setBootstrapDaemonError = error.message;
      }
      else {
        this.setBootstrapDaemonError = `${error}`;
      }
    }

    this.removingBootstrapDaemon = false;
  }

  //#endregion

}
