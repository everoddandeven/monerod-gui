import { AfterViewInit, Component, NgZone, OnDestroy, inject } from '@angular/core';
import { NavbarService } from './navbar.service';
import { NavbarLink } from './navbar.model';
import { DaemonService } from '../../../core/services/daemon/daemon.service';
import { DaemonDataService, MoneroInstallerService } from '../../../core/services';
import { DaemonSettings } from '../../../../common';
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
  private navbarService = inject(NavbarService);
  private daemonService = inject(DaemonService);
  private daemonData = inject(DaemonDataService);
  private installerService = inject(MoneroInstallerService);
  private statusService = inject(DaemonStatusService);
  private ngZone = inject(NgZone);


  private _running: boolean = false;

  public get installing(): boolean {
    return this.installerService.installing;
  }

  public get upgrading(): boolean {
    return this.installerService.upgrading;
  }

  public get quitting(): boolean {
    return this.daemonService.quitting;
  }

  public get navbarLinks(): NavbarLink[] {
    return this.navbarService.links;
  }

  public get running(): boolean {
    return this._running;
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
    return this.daemonSettings.monerodPath != '';
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

  public disablingSync: boolean = false;
  public enablingSync: boolean = false;

  private daemonSettings: DaemonSettings = new DaemonSettings();
  private subscriptions: Subscription[] = [];

  public get cannotStart(): boolean {
    return this.statusService.cannotRunBecauseBatteryPolicy;
  }

  constructor() {
    const onSavedSettingsSub: Subscription = this.daemonService.onSavedSettings.subscribe((settings: DaemonSettings) => {
      this.daemonSettings = settings;
    });

    this.daemonService.getSettings().then((settings: DaemonSettings) => {
      this.daemonSettings = settings;
      this.enableToolTips();
    }).catch((error: any) => {
      console.error(error);
      this.enableToolTips();
    });

    this.daemonService.isRunning().then((running: boolean) => {
      this.ngZone.run(() => {
        this._running = running;
        this.enableToolTips();
      });
    }).catch((error) => {
      console.error(error);
      this._running = false;
      this.enableToolTips();
    });

    const onStatusChangedSub: Subscription = this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.ngZone.run(() => {
        this._running = running;
        this.enableToolTips();
      });
    });

    this.subscriptions.push(onSavedSettingsSub, onStatusChangedSub);
  }

  private lastTooltips: Tooltip[] = [];

  private disposeTooltips(): void {
    this.lastTooltips.forEach((tooltip) => {
      tooltip.hide();
      tooltip.dispose();
    });

    this.lastTooltips = [];
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
  
      this.lastTooltips = tooltipList;
    }, 0);
  }

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

  public ngAfterViewInit(): void {
    this.enableToolTips();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.subscriptions = [];
    this.disposeTooltips();
  }
}
