import { Injectable } from '@angular/core';
import { NavbarLink } from './navbar.model';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {
  private _navbarLinks: NavbarLink[] = [];

  public get links(): NavbarLink[] {
    return this._navbarLinks;
  }

  constructor() { }

  public addLink(... navbarLinks: NavbarLink[]): void {
    navbarLinks.forEach((navLink: NavbarLink) => this._navbarLinks.push(navLink));
  }

  public setLinks(navbarLinks: NavbarLink[]): void {
    this._navbarLinks = navbarLinks;
  }

  public removeLinks(): void {
    this.setLinks([]);
  }

  public disableLinks(): void {
    this._navbarLinks.forEach((link) => link.disabled = true);
  }

  public enableLinks(): void {
    this._navbarLinks.forEach((link) => link.disabled = false);
  }

}
