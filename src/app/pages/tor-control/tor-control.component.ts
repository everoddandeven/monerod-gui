import { AfterViewInit, Component } from '@angular/core';
import { BasePageComponent } from '../base-page/base-page.component';
import { NavbarLink, NavbarService } from '../../shared/components';
import { TorDaemonService } from '../../core/services';

@Component({
  selector: 'app-tor-control',
  templateUrl: './tor-control.component.html',
  styleUrl: './tor-control.component.scss',
  standalone: false
})
export class TorControlComponent extends BasePageComponent implements AfterViewInit {

  public get running(): boolean {
    return this.torService.running;
  }
  
  public get starting(): boolean {
    return this.torService.starting;
  }

  public get stopping(): boolean {
    return this.torService.stopping;
  }


  public get enabled(): boolean {
    return this.torService.settings.enabled;
  }

  public get alertTitle(): string {
    if (this.starting) return "Starting TOR Service";
    if (this.stopping) return "Stopping TOR Service";
    if (!this.enabled) return "TOR Service disabled";
    else if (!this.running) return "TOR Service not running";
    return "";
  }

  public get alertMessage(): string {
    if (this.starting) return "TOR Service is starting";
    if (this.stopping) return "TOR Service is shutting down gracefully";
    if (!this.enabled) return "Enable TOR in daemon settings";
    else if (!this.running) return "Start monero daemon to active TOR service";
    return "";
  }

  public networkStatus: any = '';

  constructor(navbarService: NavbarService, private torService: TorDaemonService) {
    super(navbarService);

    const links = [
      new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', false, 'Overview'),
    ];

    this.setLinks(links);
  }

  public ngAfterViewInit(): void {
    this.torService.getCircuitEstablished().then((status) => {
      console.log(status);
      this.networkStatus = status;
    }).catch((error: any) => {
      this.networkStatus = `${error}`;
    });
  }
}
