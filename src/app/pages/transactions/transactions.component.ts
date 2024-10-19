import { AfterViewInit, Component, NgZone } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { TxBacklogEntry } from '../../../common/TxBacklogEntry';
import { SimpleBootstrapCard } from '../../shared/utils';
import { DaemonDataService } from '../../core/services';
import { FeeEstimate, SpentKeyImage, UnconfirmedTx } from '../../../common';
import { Subscription } from 'rxjs';
import { BasePageComponent } from '../base-page/base-page.component';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent extends BasePageComponent implements AfterViewInit {

  public canRelay: boolean;
  
  public get txPoolBacklog(): TxBacklogEntry[] {
    return this.daemonData.txPoolBacklog;
  }

  public height: number;
  public count: number;

  public txIdsJsonString: string = '';
  public relaySuccess: boolean = false;
  public relayError: string = '';

  public coinbaseTxSumHeight: number = 0;
  public coinbaseTxSumCount: number = 0;
  public cards: SimpleBootstrapCard[] = [];
  public getCoinbaseTxSumSuccess: boolean = false;
  public getCoinbaseTxSumError: string = '';

  public feeEstimateCards: SimpleBootstrapCard[] = [];
  public graceBlocks: number = 0;
  public gettingFeeEstimate: boolean = false;
  public getFeeEstimateResult?: FeeEstimate;
  public getFeeEstimateError: string = '';
  public getFeeEstimateSuccess: boolean = false;

  public get modifiedTxIds(): boolean {
    return this.txIdsJsonString != '';
  }

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonData.stopping;
  }

  public rawTxJsonString: string = '';
  public sendRawTxDoNotRelay: boolean = false;
  public sendRawTxSuccess: boolean = false;
  public sendRawTxError: string = '';
  public sendingRawTx: boolean = false;

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

  constructor(private daemonData: DaemonDataService, private daemonService: DaemonService, navbarService: NavbarService, private ngZone: NgZone) {
    super(navbarService);

    this.setLinks([
      new NavbarLink('pills-tx-pool-tab', '#pills-tx-pool', 'pills-tx-pool', false, 'Pool'),
      new NavbarLink('pills-relay-tx-tab', '#pills-relay-tx', 'pills-relay-tx', false, 'Relay Tx'),
      new NavbarLink('pills-send-raw-tx-tab', '#pills-send-raw-tx', 'pills-send-raw-tx', false, 'Send Raw Tx'),
      new NavbarLink('pills-get-fee-estimate-tab', '#pills-get-fee-estimate', 'pills-get-fee-estimate', false, 'Get Fee Estimate'),
      new NavbarLink('pills-tx-pool-backlog-tab', '#pills-tx-pool-backlog', 'pills-tx-pool-backlog', false, 'Tx Pool Backlog'),
      new NavbarLink('pills-coinbase-tx-sum-tab', '#pills-coinbase-tx-sum', 'pills-coinbase-tx-sum', false, 'Coinbase Tx Sum'),
      new NavbarLink('pills-flush-tx-pool-tab', '#pills-flush-tx-pool', 'pills-flush-tx-pool', false, 'Flush Tx Pool'),
      new NavbarLink('pills-flush-cahe-tab', '#pills-flush-cache', 'pills-flush-cache', false, 'Flush Cache')
    ]);
    this.height = 0;
    this.count = 0;

    this.canRelay = false;
  }

  public ngAfterViewInit(): void {
    this.ngZone.run(() => {      
      this.loadTables();

      const onSyncEndSub: Subscription = this.daemonData.syncEnd.subscribe(() => this.loadTables());

      this.subscriptions.push(onSyncEndSub);
    });
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

  private loadTables(): void {
    this.loadSpentKeyImagesTable();
    this.loadTransactionsTable();
    this.loadTxPoolBacklogTable();
  }

  public validTxIds(): boolean {
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
    catch(error) {
      return false;
    }
  }

  public async onRelay(): Promise<void> {
    if (!this.validTxIds()) {
      return;
    }

    const txIds: string[] = JSON.parse(this.txIdsJsonString);

    try {
      await this.daemonService.relayTx(...txIds);
      this.relaySuccess = true;
      this.relayError = '';
    }
    catch(error: any) {
      console.error(error);
      this.relaySuccess = false;
      this.relayError = `${error}`;
    }

    await this.daemonService.relayTx(...txIds);
  }

  public flushing: boolean = false;
  public flushSuccess: boolean = true;
  public flushError: string = '';
  public flushTxIdsJsonString: string = '';

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

  public async flush(): Promise<void> {
    this.flushing = true;

    try {
      await this.daemonService.flushTxPool(...this.flushTxIds);
      this.flushError = '';
      this.flushSuccess = true;
    }
    catch(error) {
      this.flushSuccess = false;
      this.flushError = `${error}`;
    }

    this.flushing = false;
  }

  public flushingCache: boolean = false;
  public flushCacheBadTxs: boolean = false;
  public flushCacheBadBlocks: boolean = false;
  public flushCacheSuccess: boolean = false;
  public flushCacheError: string = '';

  public async flushCache(): Promise<void> {
    this.flushingCache = true;

    try {
      await this.daemonService.flushCache(this.flushCacheBadTxs, this.flushCacheBadBlocks);
      this.flushCacheError = '';
      this.flushCacheSuccess = true;
    }
    catch(error) {
      this.flushCacheSuccess = false;
      this.flushCacheError = `${error}`;
    }

    this.flushingCache = false;
  }


  public async onGetCoinbaseTxSum(): Promise<void> {
    try {
      const coinbaseTxSum = await this.daemonService.getCoinbaseTxSum(this.coinbaseTxSumHeight, this.coinbaseTxSumCount);

      this.cards = [
        new SimpleBootstrapCard('Emission Amount', `${coinbaseTxSum.emissionAmount}`),
        new SimpleBootstrapCard('Emission Amount Top 64', `${coinbaseTxSum.emissionAmountTop64}`),
        new SimpleBootstrapCard('Fee Amount', `${coinbaseTxSum.feeAmount}`),
        new SimpleBootstrapCard('Fee Amount Top 64', `${coinbaseTxSum.feeAmountTop64}`),
        new SimpleBootstrapCard('Wide Emission Amount', coinbaseTxSum.wideEmissionAmount),
        new SimpleBootstrapCard('Wide Fee Amount', coinbaseTxSum.wideFeeAmount)
      ];

      this.getCoinbaseTxSumSuccess = true;
      this.getCoinbaseTxSumError = '';
    }
    catch(error: any) {
      console.error(error);
      this.getCoinbaseTxSumSuccess = false;
      this.getCoinbaseTxSumError = `${error}`;
    }
  }

  public async sendRawTx(): Promise<void> {
    this.sendingRawTx = true;

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
      this.sendRawTxSuccess = true;
      this.sendRawTxError = '';
    }
    catch(error: any) {
      this.sendRawTxError = `${error}`;
    }

    this.sendingRawTx = false;
  }

  public async getFeeEstimate(): Promise<void> {
    this.gettingFeeEstimate = true;

    try {
      this.getFeeEstimateResult = await this.daemonService.getFeeEstimate(this.graceBlocks);
      this.feeEstimateCards = [
        new SimpleBootstrapCard('Fee Per Byte', `${this.getFeeEstimateResult.fee}`),
        new SimpleBootstrapCard('Quantization Mask', `${this.getFeeEstimateResult.quantizationMask}`),
        new SimpleBootstrapCard('Fee (slow)', `${this.getFeeEstimateResult.fees[0]}`),
        new SimpleBootstrapCard('Fee (normal)', `${this.getFeeEstimateResult.fees[1]}`),
        new SimpleBootstrapCard('Fee (fast)', `${this.getFeeEstimateResult.fees[2]}`),
        new SimpleBootstrapCard('Fee (fastest)', `${this.getFeeEstimateResult.fees[3]}`)
      ];
      this.getFeeEstimateSuccess = true;
      this.getFeeEstimateError = ``;

    }
    catch(error: any) {
      console.error(error);
      this.feeEstimateCards = [];
      this.getFeeEstimateSuccess = false;
      this.getFeeEstimateError = `${error}`;
    }

    this.gettingFeeEstimate = false;
  }
}
