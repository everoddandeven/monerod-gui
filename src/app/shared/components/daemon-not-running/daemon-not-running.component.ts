import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DaemonStatusService } from './daemon-status.service';

@Component({
    selector: 'app-daemon-not-running',
    templateUrl: './daemon-not-running.component.html',
    styleUrl: './daemon-not-running.component.scss',
    standalone: false
})
export class DaemonNotRunningComponent implements OnDestroy {

  public get upgrading(): boolean {
    return this.statusService.upgrading;
  }

  public get installing(): boolean {
    return this.statusService.installing;
  }

  public get daemonRunning(): boolean {
    return this.statusService.daemonRunning;
  }

  public get daemonConfigured(): boolean {
    return this.statusService.daemonConfigured;
  }

  public get disablingSync(): boolean {
    return this.statusService.disablingSync;
  }

  public get enablingSync(): boolean {
    return this.statusService.enablingSync;
  }

  public get startingDaemon(): boolean {
    return this.statusService.startingDaemon;
  }

  public get stoppingDaemon(): boolean{
    return this.statusService.stoppingDaemon;
  }

  public get restartingDaemon(): boolean {
    return this.statusService.restartingDaemon;
  }

  public get cannotRunBecauseBatteryPolicy(): boolean {
    return this.statusService.cannotRunBecauseBatteryPolicy;
  }

  public get progressStatus(): string {
    return this.statusService.progressStatus;
  }

  public get quittingDaemon(): boolean {
    return this.statusService.quittingDaemon;
  }

  public get batteryTooLow(): boolean {
    return this.statusService.batteryTooLow;
  }

  private subscriptions: Subscription[] = [];

  constructor(private statusService: DaemonStatusService) {

  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) =>  sub.unsubscribe());
    this.subscriptions = [];
  }

  public async startDaemon(): Promise<void> {
    await this.statusService.startDaemon();
  }

  public async restartDaemon(): Promise<void> {
    await this.statusService.restartDaemon();
  }

}
