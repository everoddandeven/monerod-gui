import { Component, OnDestroy, inject } from '@angular/core';
import { BasePageComponent } from '../base-page/base-page.component';
import { LocalDestinationsData, MainData, TunnelsData } from '../../../common';
import { NavbarLink, NavbarService } from '../../shared/components';
import { DaemonService, I2pDaemonService } from '../../core/services';

@Component({
  selector: 'app-i2p-webconsole',
  templateUrl: './i2p-webconsole.component.html',
  styleUrl: './i2p-webconsole.component.scss',
  standalone: false
})
export class I2pWebconsoleComponent extends BasePageComponent implements OnDestroy {
  private i2pService = inject(I2pDaemonService);
  private daemonService = inject(DaemonService);


  private refreshing: boolean = false;
  private refreshInterval?: NodeJS.Timeout;

  public mainData: MainData = new MainData();
  public localDestinations: LocalDestinationsData = new LocalDestinationsData();
  public i2pTunnels: TunnelsData = new TunnelsData();

  public loggingLevel: 'none' | 'critical' | 'error' | 'warn' | 'info' | 'debug' = 'warn';

  public get stopping(): boolean {
    return this.i2pService.stopping || this.daemonService.stopping;
  }

  public get starting(): boolean {
    return this.i2pService.starting;
  }

  public get running(): boolean {
    return this.i2pService.running;
  }

  public get enabled(): boolean {
    return this.i2pService.settings.enabled;
  }

  public get alertTitle(): string {
    if (this.starting) return "Starting I2P Service";
    if (this.stopping) return "Stopping I2P Service";
    if (!this.enabled) return "I2P Service disabled";
    else if (!this.running) return "I2P Service not running";
    return "";
  }

  public get alertMessage(): string {
    if (this.starting) return "I2P Service is starting";
    if (this.stopping) return "I2P Service is shutting down gracefully";
    if (!this.enabled) return "Enable I2P in daemon settings";
    else if (!this.running) return "Start monero daemon to active I2P service";
    return "";
  }

  constructor() {
    const navbarService = inject(NavbarService);

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
    if (this.refreshing || !this.running) return;
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

  public async runPeerTest(): Promise<void> {
    try {
      const result = await this.i2pService.runPeerTest();
      console.log(result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  public async reloadTunnelsConfiguration(): Promise<void> {
    try {
      const result = await this.i2pService.reloadTunnelsConfiguration();
      console.log(result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  public async declineTransitTunnels(): Promise<void> {
    try {
      const result = await this.i2pService.declineTransitTunnels();
      console.log(result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  public async setLogLevel(): Promise<void> {
    try {
      const result = await this.i2pService.setLogLevel(this.loggingLevel);
      console.log(result);
    }
    catch (error: any) {
      console.error(error);
    }
  }
}

