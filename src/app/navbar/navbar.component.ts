import { Component } from '@angular/core';
import { NavbarService } from './navbar.service';
import { NavbarLink } from './navbar.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  public get navbarLinks(): NavbarLink[] {
    return this.navbarService.navbarLinks;
  }

  constructor(private navbarService: NavbarService) {

  }
}
