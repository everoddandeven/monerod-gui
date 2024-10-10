import { Injectable } from '@angular/core';
import { NavbarLink } from './navbar.model';
import { DaemonService } from '../../../core/services';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {
  private _navbarLinks: NavbarLink[] = [];
  private daemonRunning: boolean = false;

  public get links(): NavbarLink[] {
    return this._navbarLinks;
  }

  constructor(private daemonService: DaemonService) {
    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.daemonRunning = running;
      if (!running) this.disableLinks();
      if (running) this.enableLinks();
    });

    this.daemonService.isRunning().then((running: boolean) => {
      this.daemonRunning = running;
      if (!running) this.disableLinks();
      if (running) this.enableLinks();
    }).catch((error: any) => {
      console.error(error);
      this.disableLinks();
    })
   }

  public addLink(... navbarLinks: NavbarLink[]): void {
    navbarLinks.forEach((navLink: NavbarLink) => this._navbarLinks.push(navLink));
  }

  public setLinks(navbarLinks: NavbarLink[]): void {
    this._navbarLinks = navbarLinks;

    if (this.daemonRunning) this.enableLinks();
    else this.disableLinks();
  }

  public removeLinks(): void {
    this.setLinks([]);
  }

  public disableLinks(): void {
    this._navbarLinks.forEach((link) => {
      link.disabled = true;
      link.selected = false;
    });
  }

  public enableLinks(): void {
    this._navbarLinks.forEach((link, index: number) => {
      link.disabled = false
      link.selected = index == 0;
    });
  }

}
