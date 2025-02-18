import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { I2pDaemonService } from '../../../core/services';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    standalone: false
})
export class SidebarComponent {
  @Input() public isDaemonRunning: boolean = false;

  public navLinks: NavLink[] = [];
  public isLoading: boolean;
  public errorMessage: string;

  public get topLinks(): NavLink[] {
    return this.navLinks.filter((link) => link.position == 'top');
  }

  public get bottomLinks(): NavLink[] {
    return this.navLinks.filter((link) => link.position == 'bottom');
  }

  public get i2pEnabled(): boolean {
    return this.i2pService.settings.enabled;
  }

  constructor(private router: Router, private i2pService: I2pDaemonService) {
    this.updateLinks();
    this.isLoading = false;
    this.errorMessage = '';
    
    this.i2pService.onStart.subscribe(() => {
      this.updateLinks();
    });

    this.i2pService.onStop.subscribe(() => {
      this.updateLinks();
    });
  }

  private createFullLinks(): NavLink[] {
    //       new NavLink('XMRig', '/xmrig', 'icon-xr text-primary'),
    this.navLinks = [
      new NavLink('Dashboard', '/detail', 'bi bi-speedometer2'),
      new NavLink('Blockchain', '/blockchain', 'bi bi-bounding-box'),
      new NavLink('Transactions', '/transactions', 'bi bi-credit-card-2-front'),
      new NavLink('Outputs', '/outputs', 'bi bi-circle-fill'),
      new NavLink('Mining', '/mining', 'bi bi-minecart-loaded'),
      new NavLink('Hard Fork Info', '/hardforkinfo', 'bi bi-signpost-split'),
      new NavLink('Network', '/network', 'bi bi-hdd-network', 'bottom'),
      new NavLink('Peers', '/peers', 'bi bi-people', 'bottom'),
      new NavLink('Bans', '/bans', 'bi bi-ban', 'bottom'),
      new NavLink('Logs', '/logs', 'bi bi-terminal', 'bottom'),
      //new NavLink('TOR', '/torconsole', 'bi bi-bullseye', "bottom"),
      new NavLink('I2P', '/i2pwebconsole', 'bi bi-hurricane', 'bottom'),
      new NavLink('Version', '/version', 'bi bi-git', 'bottom'),
      new NavLink('Settings', '/settings', 'bi bi-gear', 'bottom'),
      new NavLink('About', '/about', 'bi bi-info-circle', 'bottom')
    ];

    return this.navLinks;
  }

  private updateLinks(): void {
    this.navLinks = this.createFullLinks();
  }

  public isActive(navLink: NavLink): boolean {
    return navLink.path == this.router.url;
  }

}

class NavLink {
  public readonly title: string;
  public readonly path: string;
  public readonly icon: string;

  public readonly position: 'top' | 'bottom';

  constructor(title: string, path: string, icon: string, position: 'top' | 'bottom' = 'top') {
    this.title = title;
    this.path = path;
    this.icon = icon;
    this.position = position;
  }
}