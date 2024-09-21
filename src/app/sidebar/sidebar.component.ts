import { CommonModule, NgClass, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { ChildActivationEnd, ChildActivationStart, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterEvent, RouterModule, RoutesRecognized } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  imports: [RouterModule, NgClass]
})
export class SidebarComponent {
  public readonly navLinks: NavLink[];
  public isLoading: boolean;
  public errorMessage: string;

  constructor(private router: Router) {
    this.navLinks = [
      new NavLink('Dashboard', '/detail', 'bi bi-speedometer2'),
      new NavLink('Mining', '/mining', 'bi bi-minecart-loaded'),
      new NavLink('Hard Fork Info', '/hardforkinfo', 'bi bi-signpost-split'),
      new NavLink('Bans', '/bans', 'bi bi-ban'),
    ];
    this.isLoading = false;
    this.errorMessage = '';
  }

  public isActive(navLink: NavLink): boolean {
    return navLink.path == this.router.url;
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