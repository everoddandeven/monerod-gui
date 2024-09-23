import { AfterViewInit, Component } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarService } from '../../navbar/navbar.service';
import { NavbarLink } from '../../navbar/navbar.model';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements AfterViewInit {
  private readonly navbarLinks: NavbarLink[];

  constructor(private daemonService: DaemonService, private navbarService: NavbarService) {
    this.navbarLinks = [
      new NavbarLink('pills-relay-tx-tab', '#pills-relay-tx', 'pills-relay-tx', true, 'Relay Tx', true),
      new NavbarLink('pills-tx-backlog', '#pills-tx-backlog', 'pills-tx-backlog', false, 'Tx Backlog', true),
      new NavbarLink('pills-flush-tx-pool-tab', '#pills-flush-tx-pool', 'pills-flush-tx-pool', false, 'Flush Tx Pool', true),
      new NavbarLink('pills-flush-cahe', '#pills-flush-cache', 'pills-flush-cache', false, 'Flush Cache', true)
    ];
  }

  ngAfterViewInit(): void {
      this.navbarService.setNavbarLinks(this.navbarLinks);
  }

  private async load(): Promise<void> {

  }
}
