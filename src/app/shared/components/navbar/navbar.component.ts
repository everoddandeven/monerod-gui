import { Component, NgZone, OnDestroy } from '@angular/core';
import { NavbarService } from './navbar.service';
import { NavbarLink } from './navbar.model';
import { DaemonService } from '../../../core/services/daemon/daemon.service';
import { MoneroInstallerService } from '../../../core/services';
import { DaemonSettings } from '../../../../common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnDestroy {

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

  private daemonSettings: DaemonSettings = new DaemonSettings();
  private subscriptions: Subscription[] = [];

  constructor(private navbarService: NavbarService, private daemonService: DaemonService, private installerService: MoneroInstallerService, private ngZone: NgZone) {
    const onSavedSettingsSub: Subscription = this.daemonService.onSavedSettings.subscribe((settings: DaemonSettings) => {
      this.daemonSettings = settings;
    });

    this.daemonService.getSettings().then((settings: DaemonSettings) => {
      this.daemonSettings = settings;
    }).catch((error: any) => {
      console.error(error);
    });

    this.daemonService.isRunning().then((running: boolean) => {
      this.ngZone.run(() => {
        this._running = running;
      });
    }).catch((error) => {
      console.error(error);
      this._running = false;
    });

    const onStatusChangedSub: Subscription = this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.ngZone.run(() => {
        this._running = running;
      });
    });

    this.subscriptions.push(onSavedSettingsSub, onStatusChangedSub);
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

  public async quit(): Promise<void> {
    await this.daemonService.quit();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.subscriptions = [];
  }
}
