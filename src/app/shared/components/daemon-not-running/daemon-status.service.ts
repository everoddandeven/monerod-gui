import { Injectable, NgZone } from '@angular/core';
import { DaemonDataService, DaemonService, ElectronService, MoneroInstallerService } from '../../../core/services';
import { Subscription } from 'rxjs';
import { DaemonSettings } from '../../../../common';

@Injectable({
  providedIn: 'root'
})
export class DaemonStatusService {

  public get upgrading(): boolean {
    return this.installer.upgrading && !this.quittingDaemon;
  }

  public get installing(): boolean {
    return this.installer.installing;
  }

  public get daemonRunning(): boolean {
    return this.daemonData.running && !this.startingDaemon && !this.stoppingDaemon && !this.restartingDaemon && !this.upgrading && !this.quittingDaemon;
  }

  public get daemonConfigured(): boolean {
    return this.settings ? this.settings.monerodPath != '' : true;
  }

  public get disablingSync(): boolean {
    return this.daemonService.disablingSync;
  }

  public get enablingSync(): boolean {
    return this.daemonService.enablingSync;
  }

  public get startingDaemon(): boolean {
    return this.daemonService.starting && !this.restartingDaemon && !this.stoppingDaemon && !this.upgrading && !this.quittingDaemon;
  }

  public get stoppingDaemon(): boolean{
    return this.daemonData.stopping && !this.restartingDaemon && !this.startingDaemon && !this.upgrading && !this.quittingDaemon;
  }

  public get restartingDaemon(): boolean {
    return this.daemonService.restarting && ! this.upgrading && !this.quittingDaemon;
  }

  public get cannotRunBecauseBatteryPolicy(): boolean {
    return this.settings ? (this._runningOnBattery && !this.settings.runOnBattery) || (this.settings.runOnBattery && this.settings.batteryLevelThreshold > 0 && this._batteryLevel <= this.settings.batteryLevelThreshold) : false;
  }

  public get progressStatus(): string {
    const progress = this.installer.progress;

    if (progress.status == 'Downloading') {
      return `${progress.status} ${progress.progress.toFixed(2)} %`;
    }

    return progress.status;
  }

  public get quittingDaemon(): boolean {
    return this.daemonService.quitting;
  }

  public get batteryTooLow(): boolean {
    return this._batteryTooLow;
  }

  private subscriptions: Subscription[] = [];
  private settings?: DaemonSettings;
  
  private _runningOnBattery: boolean = false;
  private _batteryTooLow: boolean = false;
  private _batteryLevel: number = 0;

  constructor(
    private installer: MoneroInstallerService, private daemonData: DaemonDataService, 
    private daemonService: DaemonService, private electronService: ElectronService,
    private ngZone: NgZone
  ) {
    const onSavedSettingsSub: Subscription = this.daemonService.onSavedSettings.subscribe(() => {
      this.refresh();
    });

    const onDaemonStatusSub: Subscription = this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      if (running) return;
      this.refresh();
    });

    const onAcPower: Subscription = this.electronService.onAcPower.subscribe(() => {
      this.refresh();
    });

    const onBatteryPower: Subscription = this.electronService.onBatteryPower.subscribe(() => {
      this.refresh();
    });

    this.refresh();

    this.subscriptions.push(onSavedSettingsSub, onDaemonStatusSub, onAcPower, onBatteryPower);
  }

  public refresh(): void {
    //await this.daemonService.isRunning();
    this.ngZone.run(async () => {
      this.settings = await this.daemonService.getSettings();
      this._runningOnBattery = await this.electronService.isOnBatteryPower();

      if (this._runningOnBattery) this._batteryLevel = await this.electronService.getBatteryLevel();

      if (this.settings.runOnBattery && this._runningOnBattery && this.settings.batteryLevelThreshold > 0) {
        const batteryLevel = await this.electronService.getBatteryLevel();
        this._batteryTooLow = batteryLevel <= this.settings.batteryLevelThreshold;
      }
      else if (!this.settings.runOnBattery) {
        this._batteryTooLow = false;
      }
    }).then().catch((error: any) => console.error(error));
  }

  public Dispose(): void {
    this.subscriptions.forEach((sub: Subscription) =>  sub.unsubscribe());
    this.subscriptions = [];
  }

  public async startDaemon(): Promise<void> {
    if (this.daemonRunning) {
      console.warn("Daemon already running");
      return;
    }

    if (this.startingDaemon || this.stoppingDaemon) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.daemonService.startDaemon().then(() => {
          resolve();
        }).catch((error: any) => {
          reject(new Error(`${error}`));
        });
      }, 500)});
  }

  public async restartDaemon(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.daemonService.restartDaemon().then(() => {
          resolve();
        }).catch((error: any) => {
          reject(new Error(`${error}`));
        });
      }, 500)});
  }

}
