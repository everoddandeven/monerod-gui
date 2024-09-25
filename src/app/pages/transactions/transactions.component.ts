import { AfterViewInit, Component } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { TxBacklogEntry } from '../../../common/TxBacklogEntry';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements AfterViewInit {
  private readonly navbarLinks: NavbarLink[];

  public canRelay: boolean;
  public txPoolBacklog: TxBacklogEntry[];
  public height: number;
  public count: number;

  constructor(private daemonService: DaemonService, private navbarService: NavbarService) {
    this.navbarLinks = [
      new NavbarLink('pills-relay-tx-tab', '#pills-relay-tx', 'pills-relay-tx', true, 'Relay Tx', true),
      new NavbarLink('pills-tx-backlog-tab', '#pills-tx-backlog', 'pills-tx-backlog', false, 'Tx Backlog', true),
      new NavbarLink('pills-coinbase-tx-sum-tab', '#pills-coinbase-tx-sum', 'pills-coinbase-tx-sum', false, 'Coinbase Tx Sum', true),
      new NavbarLink('pills-flush-tx-pool-tab', '#pills-flush-tx-pool', 'pills-flush-tx-pool', false, 'Flush Tx Pool', true),
      new NavbarLink('pills-flush-cahe-tab', '#pills-flush-cache', 'pills-flush-cache', false, 'Flush Cache', true)
    ];
    this.height = 0;
    this.count = 0;
    this.txPoolBacklog = [];

    this.canRelay = false;
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

  public async onRelay(): Promise<void> {
    
  }

  public async onFlush(): Promise<void> {

  }

  public async onFlushFromCache(): Promise<void> {

  }

  public async onGetCoinbaseTxSum(): Promise<void> {

  }
}
