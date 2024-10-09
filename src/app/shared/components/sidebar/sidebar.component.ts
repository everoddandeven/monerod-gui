import { CommonModule, NgClass, NgFor } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChildActivationEnd, ChildActivationStart, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterEvent, RouterModule, RoutesRecognized } from '@angular/router';
import { DaemonService } from '../../../core/services/daemon/daemon.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnChanges {
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

  constructor(private router: Router, private daemonService: DaemonService) {
    this.updateLinks();
    this.isLoading = false;
    this.errorMessage = '';
  }

  private createFullLinks(): NavLink[] {
    //       new NavLink('XMRig', '/xmrig', 'icon-xr text-primary'),
    return this.navLinks = [
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
      new NavLink('Version', '/version', 'bi bi-git', 'bottom'),
      new NavLink('Settings', '/settings', 'bi bi-gear', 'bottom')
    ];
  }

  private updateLinks(): void {
    this.navLinks = this.createFullLinks();

  }

  public isActive(navLink: NavLink): boolean {
    return navLink.path == this.router.url;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.navLinks = this.createFullLinks();

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