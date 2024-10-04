import { AfterViewInit, Component } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { DaemonDataService } from '../../core/services';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrl: './network.component.scss'
})
export class NetworkComponent implements AfterViewInit {
  public daemonRunning: boolean = false;
  public readonly navbarLinks: NavbarLink[];

  constructor(private navbarService: NavbarService, private daemonData: DaemonDataService) {
    this.navbarLinks = [
      new NavbarLink('pills-net-stats-tab', '#pills-net-stats', 'pills-net-stats', false, 'Statistics'),
      new NavbarLink('pills-limits-tab', '#pills-limits', 'pills-limits', false, 'Limits'),
      new NavbarLink('pills-public-nodes-tab', '#pills-public-nodes', 'pills-public-nodes', false, 'Public Nodes')
    ];

  }

  public ngAfterViewInit(): void {
    this.daemonRunning = this.daemonData.running;

    this.navbarService.setLinks(this.navbarLinks);
  }

}
