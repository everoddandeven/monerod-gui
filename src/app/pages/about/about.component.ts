import { Component } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  public readonly links: NavbarLink[] = [
    new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', true, 'Overview')
  ];

  constructor() {

  }

}

