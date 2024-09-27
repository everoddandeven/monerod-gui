import { AfterViewInit, Component, NgZone } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { TxBacklogEntry } from '../../../common/TxBacklogEntry';
import { SimpleBootstrapCard } from '../../shared/utils';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements AfterViewInit {
  public readonly navbarLinks: NavbarLink[];

  public canRelay: boolean;
  public txPoolBacklog: TxBacklogEntry[];
  public height: number;
  public count: number;

  public txIdsJsonString: string = '';
  public relaySuccess: boolean = false;
  public relayError: string = '';

  public coinbaseTxSumHeight: number = 0;
  public coinbaseTxSumCount: number = 0;

  public get modifiedTxIds(): boolean {
    return this.txIdsJsonString != '';
  }

  public daemonRunning: boolean = false;

  constructor(private daemonService: DaemonService, private navbarService: NavbarService, private ngZone: NgZone) {
    this.navbarLinks = [
      new NavbarLink('pills-relay-tx-tab', '#pills-relay-tx', 'pills-relay-tx', true, 'Relay Tx'),
      new NavbarLink('pills-tx-backlog-tab', '#pills-tx-backlog', 'pills-tx-backlog', false, 'Tx Backlog'),
      new NavbarLink('pills-coinbase-tx-sum-tab', '#pills-coinbase-tx-sum', 'pills-coinbase-tx-sum', false, 'Coinbase Tx Sum'),
      new NavbarLink('pills-flush-tx-pool-tab', '#pills-flush-tx-pool', 'pills-flush-tx-pool', false, 'Flush Tx Pool'),
      new NavbarLink('pills-flush-cahe-tab', '#pills-flush-cache', 'pills-flush-cache', false, 'Flush Cache')
    ];
    this.height = 0;
    this.count = 0;
    this.txPoolBacklog = [];

    this.canRelay = false;
    this.daemonService.onDaemonStatusChanged.subscribe((running) => {
      this.ngZone.run(() => {
        this.daemonRunning = running;
      });
    });
    this.daemonService.isRunning().then((value: boolean) => {
      this.ngZone.run(() => {
        this.daemonRunning = value;
      });
    });
  }

  ngAfterViewInit(): void {
      this.navbarService.setLinks(this.navbarLinks);
      this.load().then(() => {
        this.navbarService.enableLinks();
      }).catch((error) => {
        console.error(error);
        this.navbarService.disableLinks();
      })
  }

  private async load(): Promise<void> {
    try {
      this.txPoolBacklog = await this.daemonService.getTxPoolBacklog();
      console.log(this.txPoolBacklog)
    }
    catch (error) {
      throw error;
    }
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
    catch(error) {
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

  public cards: SimpleBootstrapCard[] = [];
  public getCoinbaseTxSumSuccess: boolean = false;
  public getCoinbaseTxSumError: string = '';

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
    catch(error) {
      console.error(error);
      this.getCoinbaseTxSumSuccess = false;
      this.getCoinbaseTxSumError = `${error}`;
    }
  }
}
