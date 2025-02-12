import { Component, OnDestroy } from '@angular/core';
import { BasePageComponent } from '../base-page/base-page.component';
import { LocalDestinationsData, MainData, TunnelsData } from '../../../common';
import { NavbarLink, NavbarService } from '../../shared/components';

@Component({
  selector: 'app-i2p-webconsole',
  imports: [],
  templateUrl: './i2p-webconsole.component.html',
  styleUrl: './i2p-webconsole.component.scss',
  standalone: false
})
export class I2pWebconsoleComponent extends BasePageComponent implements OnDestroy {
  private readonly host: string = 'http://127.0.0.1:7070';

  private refreshing: boolean = false;
  private refreshInterval?: NodeJS.Timeout;

  public mainData: MainData = new MainData();
  public localDestinations: LocalDestinationsData = new LocalDestinationsData();
  public i2pTunnels: TunnelsData = new TunnelsData();

  constructor(navbarService: NavbarService) {
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
      this.mainData = await this.getMainData();
      this.localDestinations = await this.getLocalDestinations();
      this.i2pTunnels = await this.getI2pTunnels();
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

  private async fetchContent(request: string = ''): Promise<HTMLDivElement> {
    return await new Promise<HTMLDivElement>((resolve, reject) => {
      fetch(`${this.host}/${request}`)
      .then(response => response.text())
      .then(html => {  
        const _content = document.createElement('div');
        _content.innerHTML = html;
    
        for (let i = 0; i < _content.children.length; i++) {
          const child = _content.children.item(i);
          if (!child) continue;
  
          if (child.className === 'wrapper') {
            resolve(child as HTMLDivElement);
            return;
          }
        }

        reject(new Error('Wrapper not found'));
      })
      .catch(error => reject(error));
    });
  }

  public async getMainData(): Promise<MainData> {
    return MainData.fromWrapper(await this.fetchContent())
  }

  public async getLocalDestinations(): Promise<LocalDestinationsData> {
    return LocalDestinationsData.fromWrapper(await this.fetchContent('?page=local_destinations'));
  }

  public async getI2pTunnels(): Promise<TunnelsData> {
    return TunnelsData.fromWrapper(await this.fetchContent('?page=i2p_tunnels'));
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();

    if (this.refreshInterval === undefined) return;
    clearInterval(this.refreshInterval);
  }

}

