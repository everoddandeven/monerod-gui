import { Component } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  public readonly links: NavbarLink[] = [
    new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', true, 'Overview')
  ];

  public get guiVersion(): string {
    return this.daemonService.getGuiVersion();
  }

  constructor(private daemonService: DaemonService) {

  }

}

