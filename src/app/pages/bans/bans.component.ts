import { AfterViewInit, Component, NgZone } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';


@Component({
  selector: 'app-bans',
  templateUrl: './bans.component.html',
  styleUrl: './bans.component.scss'
})
export class BansComponent implements AfterViewInit {
  public readonly navbarLinks: NavbarLink[] = [
    new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', true, 'Overview', true),
    new NavbarLink('pills-set-bans-tab', '#pills-set-bans', 'pills-set-bans', false, 'Set Bans', true)
  ];
  public daemonRunning: boolean = false;
  public get daemonChangingStatus(): boolean {
    return this.daemonService.stopping || this.daemonService.starting;
  }

  constructor(private router: Router, private daemonService: DaemonService, private navbarService: NavbarService, private ngZone: NgZone) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url != '/bans') return;
        this.onNavigationEnd();
      }
    })

    this.daemonService.isRunning().then((running) => {
      this.daemonRunning = running
    });
    
    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.daemonRunning = running;

      if (running) this.load();
    });

  }

  ngAfterViewInit(): void {
    this.navbarService.removeLinks();

    console.log('BansComponent AFTER VIEW INIT');

    this.ngZone.run(() => {
      //const $ = require('jquery');
      //const bootstrapTable = require('bootstrap-table');
      
      const $table = $('#bansTable');
      $table.bootstrapTable({
        
      });
      $table.bootstrapTable('refreshOptions', {
        classes: 'table table-bordered table-hover table-dark table-striped'
      });
      $table.bootstrapTable('showLoading');      
      this.load();

    });
  }

  private onNavigationEnd(): void {
    this.navbarService.removeLinks();
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
    $table.bootstrapTable('hideLoading');
    $table.bootstrapTable('load', bans);

  }

  public async setBans() {
    
  }

}
