import { CommonModule, NgClass, NgFor } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChildActivationEnd, ChildActivationStart, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterEvent, RouterModule, RoutesRecognized } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnChanges {
  @Input() public isDaemonRunning: boolean = false;

  public navLinks: NavLink[];
  public isLoading: boolean;
  public errorMessage: string;

  constructor(private router: Router) {
    if (!this.isDaemonRunning) {
      this.navLinks = [
        new NavLink('Dashboard', '/detail', 'bi bi-speedometer2'),
        new NavLink('Settings', '/settings', 'bi bi-gear')
      ];
    }
    else {
      this.navLinks = [
        new NavLink('Dashboard', '/detail', 'bi bi-speedometer2'),
        new NavLink('Blockchain', '/blockchain', 'bi bi-bounding-box'),
        new NavLink('Transactions', '/transactions', 'bi bi-credit-card-2-front'),
        new NavLink('Outputs', '/outputs', 'bi bi-circle-fill'),
        new NavLink('Mining', '/mining', 'bi bi-minecart-loaded'),
        new NavLink('Hard Fork Info', '/hardforkinfo', 'bi bi-signpost-split'),
        new NavLink('Bans', '/bans', 'bi bi-ban'),
        new NavLink('Settings', '/settings', 'bi bi-gear')
      ];
    }
    this.isLoading = false;
    this.errorMessage = '';
  }

  public isActive(navLink: NavLink): boolean {
    return navLink.path == this.router.url;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!this.isDaemonRunning) {
      this.navLinks = [
        new NavLink('Dashboard', '/detail', 'bi bi-speedometer2'),
        new NavLink('Settings', '/settings', 'bi bi-gear')
      ];
    }
    else {
      this.navLinks = [
        new NavLink('Dashboard', '/detail', 'bi bi-speedometer2'),
        new NavLink('Blockchain', '/blockchain', 'bi bi-bounding-box'),
        new NavLink('Transactions', '/transactions', 'bi bi-credit-card-2-front'),
        new NavLink('Outputs', '/outputs', 'bi bi-circle-fill'),
        new NavLink('Mining', '/mining', 'bi bi-minecart-loaded'),
        new NavLink('Hard Fork Info', '/hardforkinfo', 'bi bi-signpost-split'),
        new NavLink('Bans', '/bans', 'bi bi-ban'),
        new NavLink('Settings', '/settings', 'bi bi-gear')
      ];
    }
  }

}

class NavLink {
  public readonly title: string;
  public readonly path: string;
  public readonly icon: string;

  constructor(title: string, path: string, icon: string) {
    this.title = title;
    this.path = path;
    this.icon = icon;
  }
}