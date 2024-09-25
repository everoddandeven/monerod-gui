import { AfterViewInit, Component } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrl: './version.component.scss'
})
export class VersionComponent implements AfterViewInit {
  private readonly links: NavbarLink[];

  constructor(private navbarService: NavbarService, private daemonService: DaemonService) {
    this.links = [
      new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', true, 'Overview')
    ];
  }

  ngAfterViewInit(): void {
      this.navbarService.setLinks(this.links);
  }
}
