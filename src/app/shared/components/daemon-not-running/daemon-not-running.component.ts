import { Component, Input, NgZone } from '@angular/core';
import { DaemonService } from '../../../core/services/daemon/daemon.service';
import { DaemonDataService } from '../../../core/services';

@Component({
  selector: 'app-daemon-not-running',
  templateUrl: './daemon-not-running.component.html',
  styleUrl: './daemon-not-running.component.scss'
})
export class DaemonNotRunningComponent {

  public get daemonRunning(): boolean {
    return this.daemonData.running && !this.startingDaemon && !this.stoppingDaemon && !this.restartingDaemon;
  }

  public daemonConfigured: boolean = true;

  public get startingDaemon(): boolean {
    return this.daemonService.starting && !this.restartingDaemon;
  }

  public get stoppingDaemon(): boolean{
    return this.daemonData.stopping && !this.restartingDaemon;
  }

  public get restartingDaemon(): boolean {
    return this.daemonService.restarting;
  }

  constructor(private daemonData: DaemonDataService, private daemonService: DaemonService, private ngZone: NgZone) {
    this.daemonService.getSettings().then((settings) => {
      this.daemonConfigured = settings.monerodPath != '';
    })
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
      setTimeout(async () => {
        try {
          await this.daemonService.startDaemon();
          resolve();
        }
        catch(error) {
          console.error(error);
          reject(error);
        }
      }, 500)});
  }

  public async restartDaemon(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        try {
          await this.daemonService.restartDaemon();
          resolve();
        }
        catch(error) {
          console.error(error);
          reject(error);
        }
      }, 500)});
  }

}
