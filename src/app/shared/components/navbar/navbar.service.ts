import { EventEmitter, Injectable, NgZone } from '@angular/core';
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

  public get onDaemonStatusChanged(): EventEmitter<boolean> {
    return this.daemonService.onDaemonStatusChanged;
  }

  constructor(private daemonService: DaemonService, private zone: NgZone) {
    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.daemonRunning = running;
      this.refreshLinks();
    });

    this.daemonService.isRunning().then((running: boolean) => {
      this.daemonRunning = running;
    }).catch((error: any) => {
      console.error(error);
    }).finally(() => {
      this.refreshLinks();
    });
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

  public addLink(... navbarLinks: NavbarLink[]): void {
    navbarLinks.forEach((navLink: NavbarLink) => this._navbarLinks.push(navLink));
  }

  private get enabled(): boolean {
    return this.daemonRunning && !this.daemonService.stopping && !this.daemonService.starting && !this.daemonService.restarting;
  }

  public setLinks(navbarLinks: NavbarLink[]): void {
    this._navbarLinks = navbarLinks;

    if (this.enabled) this.enableLinks();
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
