import { Component, NgZone } from '@angular/core';
import { DaemonService } from '../../../core/services/daemon/daemon.service';
import { DaemonDataService, MoneroInstallerService } from '../../../core/services';

@Component({
  selector: 'app-daemon-not-running',
  templateUrl: './daemon-not-running.component.html',
  styleUrl: './daemon-not-running.component.scss'
})
export class DaemonNotRunningComponent {

  public get upgrading(): boolean {
    return this.installer.upgrading && !this.quittingDaemon;
  }

  public get daemonRunning(): boolean {
    return this.daemonData.running && !this.startingDaemon && !this.stoppingDaemon && !this.restartingDaemon && !this.upgrading && !this.quittingDaemon;
  }

  public daemonConfigured: boolean = true;

  public get startingDaemon(): boolean {
    return this.daemonService.starting && !this.restartingDaemon && !this.stoppingDaemon && !this.upgrading && !this.quittingDaemon;
  }

  public get stoppingDaemon(): boolean{
    return this.daemonData.stopping && !this.restartingDaemon && !this.startingDaemon && !this.upgrading && !this.quittingDaemon;
  }

  public get restartingDaemon(): boolean {
    return this.daemonService.restarting && ! this.upgrading && !this.quittingDaemon;
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

  constructor(private installer: MoneroInstallerService, private daemonData: DaemonDataService, private daemonService: DaemonService, private ngZone: NgZone) {
    this.daemonService.getSettings().then((settings) => {
      this.daemonConfigured = settings.monerodPath != '';
    }).catch((error: any) => {
      console.error(error);
      this.daemonConfigured = false;
    });

    this.daemonService.isRunning().then().catch((error: any) => console.error(error));
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
          reject(error);
        });
      }, 500)});
  }

  public async restartDaemon(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.daemonService.restartDaemon().then(() => {
          resolve();
        }).catch((error: any) => {
          reject(error);
        });
      }, 500)});
  }

}
