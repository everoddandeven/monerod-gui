import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { I2pDaemonService } from '../../../core/services';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    standalone: false
})
export class SidebarComponent {
  private router = inject(Router);
  private i2pService = inject(I2pDaemonService);

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

  constructor() {
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
      new NavLink('Blockchain', '/blockchain', 'bi bi-boxes'),
      new NavLink('Mining', '/mining', 'bi bi-minecart-loaded'),
      new NavLink('Network', '/network', 'bi bi-globe', 'bottom'),
      new NavLink('Logs', '/logs', 'bi bi-terminal', 'bottom'),
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