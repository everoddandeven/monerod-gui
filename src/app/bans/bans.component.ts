import { AfterViewInit, Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NavbarService } from '../navbar/navbar.service';
import { DaemonService } from '../core/services/daemon/daemon.service';

@Component({
  selector: 'app-bans',
  templateUrl: './bans.component.html',
  styleUrl: './bans.component.scss'
})
export class BansComponent implements AfterViewInit {
  
  constructor(private router: Router, private daemonService: DaemonService, private navbarService: NavbarService) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url != '/bans') return;
        this.onNavigationEnd();
      }
    })
  }

  ngAfterViewInit(): void {
    this.navbarService.removeNavbarLinks();

    console.log('BansComponent AFTER VIEW INIT');

    setTimeout(() => {
      const $table = $('#bansTable');
      $table.bootstrapTable({});
      $table.bootstrapTable('refreshOptions', {
        classes: 'table table-bordered table-hover table-dark table-striped'
      });        
      this.load();

    }, 500);
  }

  private onNavigationEnd(): void {
    this.navbarService.removeNavbarLinks();
  }

  private async load(): Promise<void> {
    const $table = $('#bansTable');

    const _bans = await this.daemonService.getBans();
    const bans: any[] = [];

    _bans.forEach((ban) => bans.push({
      'ip': ban.ip,
      'host': ban.host,
      'seconds': ban.seconds
    }));

    $table.bootstrapTable('load', bans);

  }

}
