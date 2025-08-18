import { AfterViewInit, Component, NgZone, OnDestroy, inject } from '@angular/core';
import { NavbarService } from './navbar.service';
import { NavbarPill } from './navbar.model';
import { DaemonService } from '../../../core/services/daemon/daemon.service';
import { DaemonDataService, MoneroInstallerService } from '../../../core/services';
import { Subscription } from 'rxjs';
import { Tooltip } from 'bootstrap';
import { DaemonStatusService } from '../daemon-not-running/daemon-status.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss',
    standalone: false
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  
  // #region Attributes

  private navbarService = inject(NavbarService);
  private daemonService = inject(DaemonService);
  private daemonData = inject(DaemonDataService);
  private installerService = inject(MoneroInstallerService);
  private statusService = inject(DaemonStatusService);
  private ngZone = inject(NgZone);
  private subscriptions: Subscription[] = [];
  private tooltips: Tooltip[] = [];

  public disablingSync: boolean = false;
  public enablingSync: boolean = false;

  // #endregion

  // #region Getters

  public get installing(): boolean {
    return this.installerService.installing;
  }

  public get upgrading(): boolean {
    return this.installerService.upgrading;
  }

  public get quitting(): boolean {
    return this.daemonService.quitting;
  }

  public get navbarLinks(): NavbarPill[] {
    return this.navbarService.links;
  }

  public get running(): boolean {
    return this.daemonData.running;
  }

  public get starting(): boolean {
    return this.daemonService.starting;
  }

  public get stopping(): boolean {
    return this.daemonService.stopping;
  }

  public get restarting(): boolean {
    return this.daemonService.restarting;
  }

  public get daemonConfigured(): boolean {
    return this.daemonService.settings.monerodPath != '';
  }

  public get syncDisabled(): boolean {
    return this.syncDisabledByPeriodPolicy || this.syncDisabledByWifiPolicy || this.daemonService.settings.noSync;
  }

  public get syncDisabledByPeriodPolicy(): boolean {
    return this.daemonData.syncDisabledByPeriodPolicy;
  }

  public get syncDisabledByWifiPolicy(): boolean {
    return this.daemonData.syncDisabledByWifiPolicy;
  }

  public get cannotStart(): boolean {
    return this.statusService.cannotRunBecauseBatteryPolicy;
  }

  // #endregion

  constructor() {
    
  }

  // #region Private Methods

  private disposeTooltips(): void {
    this.tooltips.forEach((tooltip) => {
      tooltip.hide();
      tooltip.dispose();
    });

    this.tooltips = [];
  }

  private enableToolTips(): void {
    setTimeout(() => {
      this.disposeTooltips();

      const tooltipTriggerList: Element[] = [] ;
    
      const queryResult = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      
      queryResult.forEach((el) => tooltipTriggerList.push(el));

      const tooltipList: Tooltip[] = tooltipTriggerList.map(tooltipTriggerEl => new Tooltip(tooltipTriggerEl, {
        placement: 'bottom'
      }));
  
      this.tooltips = tooltipList;
    }, 0);
  }

  // #endregion

  // #region Public Methods

  //#region Angular Methods

  public ngAfterViewInit(): void {

    const onStatusChangedSub: Subscription = this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      console.log(running);
      this.ngZone.run(() => {
        this.enableToolTips();
      });
    });

    this.subscriptions.push(onStatusChangedSub);

    this.enableToolTips();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.subscriptions = [];
    this.disposeTooltips();
  }

  // #endregion

  public async startDaemon(): Promise<void> {
    try {
      await this.daemonService.startDaemon();
    } catch(error) {
      console.error(error);
    }
  }

  public async stopDaemon(): Promise<void> {
    try {
      await this.daemonService.stopDaemon();
    } catch(error) {
      console.error(error);
    }
  }

  public async restartDaemon(): Promise<void> {
    await this.daemonService.restartDaemon();
  }

  public async startSync(): Promise<void> {
    this.enablingSync = true;

    try {
      await this.daemonService.enableSync();
    }
    catch(error: any) {
      console.error(error);
    }

    this.enablingSync = false;
  }

  public async stopSync(): Promise<void> {
    this.disablingSync = true;

    try {
      await this.daemonService.disableSync();
    }
    catch(error: any) {
      console.error(error);
    }

    this.disablingSync = false;
  }

  public async quit(): Promise<void> {
    await this.daemonService.quit();
  }

  // #endregion
}
