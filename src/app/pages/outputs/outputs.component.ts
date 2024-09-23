import { AfterViewInit, Component } from '@angular/core';
import { NavbarLink } from '../../navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarService } from '../../navbar/navbar.service';

@Component({
  selector: 'app-outputs',
  templateUrl: './outputs.component.html',
  styleUrl: './outputs.component.scss'
})
export class OutputsComponent implements AfterViewInit {
  private readonly navbarLinks: NavbarLink[];

  constructor(private daemonService: DaemonService, private navbarService: NavbarService) {
    this.navbarLinks = [
      new NavbarLink('pills-outputs-overview-tab', '#pills-outputs-overview', 'outputs-overview', true, 'Overview'),
      new NavbarLink('pills-outputs-histogram-tab', '#pills-outputs-histogram', 'outputs-histogram', false, 'Histogram'),
      new NavbarLink('pills-outputs-distribution-tab', '#pills-outputs-distribution', 'outputs-distribution', false, 'Distribution')

    ];
  }

  ngAfterViewInit(): void {
      this.navbarService.setNavbarLinks(this.navbarLinks);
  }
}
