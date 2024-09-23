import { Injectable } from '@angular/core';
import { NavbarLink } from './navbar.model';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {
  private _navbarLinks: NavbarLink[] = [];

  public get navbarLinks(): NavbarLink[] {
    return this._navbarLinks;
  }

  constructor() { }

  public addNavbarLink(... navbarLinks: NavbarLink[]): void {
    navbarLinks.forEach((navLink: NavbarLink) => this._navbarLinks.push(navLink));
  }

  public setNavbarLinks(navbarLinks: NavbarLink[]): void {
    this._navbarLinks = navbarLinks;
  }

  public removeNavbarLinks(): void {
    this.setNavbarLinks([]);
  }

  public disableNavbarLinks(): void {
    this._navbarLinks.forEach((link) => link.disabled = true);
  }

  public enableNavbarLinks(): void {
    this._navbarLinks.forEach((link) => link.disabled = false);
  }

}
