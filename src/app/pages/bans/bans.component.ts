import { AfterViewInit, Component, NgZone, inject } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonDataService } from '../../core/services';
import { Ban } from '../../../common';
import { BasePageComponent } from '../base-page/base-page.component';


@Component({
    selector: 'app-bans',
    templateUrl: './bans.component.html',
    styleUrl: './bans.component.scss',
    standalone: false
})
export class BansComponent extends BasePageComponent implements AfterViewInit {
  private daemonData = inject(DaemonDataService);
  private daemonService = inject(DaemonService);
  private ngZone = inject(NgZone);
  
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
    catch(error: any) {
      console.error(error);
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

  constructor() {
    const navbarService = inject(NavbarService);

    super(navbarService);

    this.setLinks([
      new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', false, 'Overview', true),
      new NavbarLink('pills-set-bans-tab', '#pills-set-bans', 'pills-set-bans', false, 'Set Bans', true)
    ]);
  }

  public ngAfterViewInit(): void {
    this.ngZone.run(async () => {

      this.initTable('bansTable', true);

      await this.refreshBansTable();
    }).then().catch((error: any) => {
      console.error(error);
    });
  }

  public async refreshBansTable(): Promise<void> {
    let bans: Ban[] = [];
    
    try {
      const running = await this.daemonService.isRunning();

      if (running) {
        bans = await this.daemonService.getBans();
      }
      else {
        bans = [];
      }
    }
    catch (error) {
      console.error(error);
      bans = [];
    }

    this.loadTable('bansTable', bans);
  }

  public async setBans(): Promise<void> {
    this.settingBans = true;

    try {
      await this.daemonService.setBans(...this.bans);
      this.setBansError = '';
      this.setBansSuccess = true;
    }
    catch (error: any) {
      console.error(error);
      this.setBansSuccess = false;
      this.setBansError = `${error}`;
    }

    this.settingBans = false;
  }

}
