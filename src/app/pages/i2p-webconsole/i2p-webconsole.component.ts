import { Component, OnDestroy } from '@angular/core';
import { BasePageComponent } from '../base-page/base-page.component';
import { LocalDestinationsData, MainData, TunnelsData } from '../../../common';
import { NavbarLink, NavbarService } from '../../shared/components';
import { I2pDaemonService } from '../../core/services';

@Component({
  selector: 'app-i2p-webconsole',
  templateUrl: './i2p-webconsole.component.html',
  styleUrl: './i2p-webconsole.component.scss',
  standalone: false
})
export class I2pWebconsoleComponent extends BasePageComponent implements OnDestroy {

  private refreshing: boolean = false;
  private refreshInterval?: NodeJS.Timeout;

  public mainData: MainData = new MainData();
  public localDestinations: LocalDestinationsData = new LocalDestinationsData();
  public i2pTunnels: TunnelsData = new TunnelsData();

  public loggingLevel: string = 'warn';

  constructor(navbarService: NavbarService, private i2pService: I2pDaemonService) {
    super(navbarService);

    const links = [
      new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', false, 'Overview'),
      new NavbarLink('pills-router-commands-tab', '#pills-router-commands', 'pills-router-commands', false, 'Commands'),
      new NavbarLink('pills-local-destinations-tab', '#pills-local-destinations', 'pills-local-destinations', false, 'Local Destinations'),
      new NavbarLink('pills-i2p-tunnels-tab', '#pills-i2p-tunnels', 'pills-i2p-tunnels', false, 'I2P Tunnels'),
    ];

    this.setLinks(links);
    this.startLoop();
  }

  private readonly refreshHandler: () => void = () => this.refresh();

  private async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;

    try {
      this.mainData = await this.i2pService.getMainData();
      this.localDestinations = await this.i2pService.getLocalDestinations();
      this.i2pTunnels = await this.i2pService.getI2pTunnels();
    }
    catch (error: any) {
      console.error(error);
    }

    this.refreshing = false;
  }

  private startLoop() {
    if (this.refreshInterval !== undefined) throw new Error("loop already started");
    this.refresh().then(() => {
      this.refreshInterval = setInterval(this.refreshHandler, 5000);
    }).catch((error: any) => console.error(error));
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();

    if (this.refreshInterval === undefined) return;
    clearInterval(this.refreshInterval);
  }

}

