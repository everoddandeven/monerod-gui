import { Component, NgZone } from '@angular/core';
import { NavbarService } from './navbar.service';
import { NavbarLink } from './navbar.model';
import { DaemonService } from '../../../core/services/daemon/daemon.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  private _running: boolean = false;

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

  constructor(private navbarService: NavbarService, private daemonService: DaemonService, private ngZone: NgZone) {
    
    this.daemonService.isRunning().then((running: boolean) => {
      this.ngZone.run(() => {
        this._running = running;
      });
    });

    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.ngZone.run(() => {
        this._running = running;
      });
    });

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

  }
}
