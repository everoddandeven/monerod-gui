import { Component, Input, NgZone } from '@angular/core';
import { DaemonService } from '../../../core/services/daemon/daemon.service';

@Component({
  selector: 'app-daemon-not-running',
  templateUrl: './daemon-not-running.component.html',
  styleUrl: './daemon-not-running.component.scss'
})
export class DaemonNotRunningComponent {

  public daemonRunning: boolean = false;
  public startingDaemon: boolean = false;
  private stoppingDaemon: boolean = false;


  constructor(private daemonService: DaemonService, private ngZone: NgZone) {
    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.ngZone.run(() => this.daemonRunning = running);
      this.daemonRunning = running;
    });
    this.daemonService.isRunning().then((running: boolean) => {
      this.ngZone.run(() => this.daemonRunning = running);
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

    this.startingDaemon = true;

    setTimeout(async () => {
      try {
        await this.daemonService.startDaemon();
        this.daemonRunning = await this.daemonService.isRunning();
      }
      catch(error) {
        console.error(error);
        this.daemonRunning = false;
      }
  
      this.startingDaemon = false;
    }, 500);
  }  

}
