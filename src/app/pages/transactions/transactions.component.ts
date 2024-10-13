import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { TxBacklogEntry } from '../../../common/TxBacklogEntry';
import { SimpleBootstrapCard } from '../../shared/utils';
import { DaemonDataService } from '../../core/services';
import { FeeEstimate, SpentKeyImage, UnconfirmedTx } from '../../../common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements AfterViewInit, OnDestroy {
  public readonly navbarLinks: NavbarLink[];

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

  private subscriptions: Subscription[] = [];

  constructor(private daemonData: DaemonDataService, private daemonService: DaemonService, private navbarService: NavbarService, private ngZone: NgZone) {
    this.navbarLinks = [
      new NavbarLink('pills-tx-pool-tab', '#pills-tx-pool', 'pills-tx-pool', false, 'Pool'),
      new NavbarLink('pills-relay-tx-tab', '#pills-relay-tx', 'pills-relay-tx', false, 'Relay Tx'),
      new NavbarLink('pills-send-raw-tx-tab', '#pills-send-raw-tx', 'pills-send-raw-tx', false, 'Send Raw Tx'),
      new NavbarLink('pills-get-fee-estimate-tab', '#pills-get-fee-estimate', 'pills-get-fee-estimate', false, 'Get Fee Estimate'),
      new NavbarLink('pills-tx-pool-backlog-tab', '#pills-tx-pool-backlog', 'pills-tx-pool-backlog', false, 'Tx Pool Backlog'),
      new NavbarLink('pills-coinbase-tx-sum-tab', '#pills-coinbase-tx-sum', 'pills-coinbase-tx-sum', false, 'Coinbase Tx Sum'),
      new NavbarLink('pills-flush-tx-pool-tab', '#pills-flush-tx-pool', 'pills-flush-tx-pool', false, 'Flush Tx Pool'),
      new NavbarLink('pills-flush-cahe-tab', '#pills-flush-cache', 'pills-flush-cache', false, 'Flush Cache')
    ];
    this.height = 0;
    this.count = 0;

    this.canRelay = false;
  }

  public ngAfterViewInit(): void {
    this.ngZone.run(() => {
      this.navbarService.setLinks(this.navbarLinks);
      
      this.initTables();
      this.subscriptions.push(this.daemonData.syncEnd.subscribe(() => {
        this.refreshTables();
      }));
    });
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });

    this.subscriptions = [];
  }

  private initTable(id: string): void {
    const $table = $(`#${id}`);

    $table.bootstrapTable({});
    $table.bootstrapTable('refreshOptions', {
      classes: 'table table-bordered table-hover table-dark table-striped'
    });
  }

  private initTables(): void {
    this.initTable('spentKeyImagesTable');
    this.initTable('transactionsTable');
    this.initTable('txPoolBacklogTable');
  }

  private loadTransactionsTable(): void {
    const $table = $('#transactionsTable');

    $table.bootstrapTable('load', this.unconfirmedTxs);
  }

  private loadSpentKeyImagesTable(): void {
    const $table = $('#spentKeyImagesTable');

    $table.bootstrapTable('load', this.spentKeyImages);
  }

  private loadTxPoolBacklogTable(): void {
    const $table = $('#txPoolBacklogTable');

    $table.bootstrapTable('load', this.txPoolBacklog)
  }

  private refreshTables(): void {
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

  public async onFlush(): Promise<void> {

  }

  public async onFlushFromCache(): Promise<void> {

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
