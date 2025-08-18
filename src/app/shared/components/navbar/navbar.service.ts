import { EventEmitter, Injectable, NgZone, inject } from '@angular/core';
import { NavbarPill } from './navbar.model';
import { DaemonDataService, DaemonService } from '../../../core/services';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {
  private daemonService = inject(DaemonService);
  private daemonDataService = inject(DaemonDataService);
  private zone = inject(NgZone);

  private _navbarLinks: NavbarPill[] = [];

  private get daemonRunning(): boolean {
    return this.daemonDataService.running;
  }

  public get links(): NavbarPill[] {
    return this._navbarLinks;
  }

  public get onDaemonStatusChanged(): EventEmitter<boolean> {
    return this.daemonService.onDaemonStatusChanged;
  }

  constructor() {
    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      console.log(running);
      this.refreshLinks();
    });

    this.refreshLinks();
  }

  private refreshLinks(): void {
    if (this._navbarLinks.length == 0) {
      return;
    }

    const links = this._navbarLinks;
    this.zone.run(() => {
      setTimeout(() => {
        this.setLinks([]);
      }, 0);
      setTimeout(() => {
        this.setLinks(links);
      }, 0);
    })
  }

  public addLink(... navbarLinks: NavbarPill[]): void {
    navbarLinks.forEach((navLink: NavbarPill) => this._navbarLinks.push(navLink));
  }

  private get enabled(): boolean {
    return this.daemonRunning && !this.daemonService.stopping && !this.daemonService.starting && !this.daemonService.restarting;
  }

  public setLinks(navbarLinks: NavbarPill[]): void {
    this._navbarLinks = navbarLinks;

    if (this.enabled) this.enableLinks();
    else this.disableLinks();
  }

  public removeLinks(): void {
    this.setLinks([]);
  }

  public disableLinks(): void {
    this._navbarLinks.forEach((link) => {
      if (!link.disableIfNotRunning) return;
      link.disabled = true;
      link.selected = false;
    });
  }

  public enableLinks(): void {
    const hasIndLinkEnabled = this.hasIndipendentLinkEnabled;

    this._navbarLinks.forEach((link, index: number) => {
      link.disabled = false
      
      if (!hasIndLinkEnabled) link.selected = index == 0;
    });
  }

  private get hasIndipendentLinkEnabled(): boolean {
    return this._navbarLinks.forEach((n) => n.selected && !n.disableIfNotRunning) !== undefined;
  }

}
