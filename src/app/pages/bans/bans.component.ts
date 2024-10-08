import { AfterViewInit, Component, NgZone } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonDataService } from '../../core/services';
import { Ban } from '../../../common';


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
  
  public refreshingBansTable: boolean = false;
  
  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }
  
  public get daemonStopping(): boolean {
    return this.daemonData.stopping;
  }
  
  public get daemonChangingStatus(): boolean {
    return this.daemonService.stopping || this.daemonService.starting;
  }

  public settingBans: boolean = false;
  public setBansBansJsonString: string = '';
  public setBansSuccess: boolean = false;
  public setBansError: string = '';

  public get validBans(): boolean {
    try {
      const bans: any[] = JSON.parse(this.setBansBansJsonString);

      if (!Array.isArray(bans)) {
        return false;
      }

      bans.forEach((ban) => Ban.parse(ban));

      return true;
    }
    catch(error) {
      return false;
    }
  }

  private get bans(): Ban[] {
    if (!this.validBans) {
      return [];
    }
    const bans: Ban[] = [];
    const rawBans: any[] = [];

    rawBans.forEach((rawBan) => bans.push(Ban.parse(rawBan)));

    return bans;
  }

  constructor(private daemonData: DaemonDataService, private daemonService: DaemonService, private navbarService: NavbarService, private ngZone: NgZone) {
  }

  public ngAfterViewInit(): void {
    this.navbarService.setLinks(this.navbarLinks);

    this.ngZone.run(() => {
      const $table = $('#bansTable');
      $table.bootstrapTable({});
      $table.bootstrapTable('refreshOptions', {
        classes: 'table table-bordered table-hover table-dark table-striped'
      });
      $table.bootstrapTable('showLoading');      
      this.refreshBansTable();

    });
  }

  public async refreshBansTable(): Promise<void> {
    const $table = $('#bansTable');
    let _bans: Ban[] = [];
    
    try {
      _bans = await this.daemonService.getBans();
    }
    catch (error) {
      console.error(error);
      _bans = [];
    }

    const bans: any[] = [];

    _bans.forEach((ban) => bans.push({
      'ip': ban.ip,
      'host': ban.host,
      'seconds': ban.seconds
    }));
    $table.bootstrapTable('hideLoading');
    $table.bootstrapTable('load', bans);

  }

  public async setBans(): Promise<void> {
    this.settingBans = true;

    try {
      await this.daemonService.setBans(...this.bans);
      this.setBansError = '';
      this.setBansSuccess = true;
    }
    catch (error) {
      console.error(error);
      this.setBansSuccess = false;
      this.setBansError = `${error}`;
    }

    this.settingBans = false;
  }

}
