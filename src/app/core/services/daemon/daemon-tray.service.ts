import { Injectable } from '@angular/core';
import { DaemonService } from './daemon.service';

@Injectable({
  providedIn: 'root'
})
export class DaemonTrayService {

  constructor(private daemonService: DaemonService) {
    this.registerIpcEvents();
    this.daemonService.isRunning()
      .then((running: boolean) => this.loadTrayItems(running))
      .catch((error: any) => {
        console.error(error);
        this.loadTrayItems(false);
      });
  }

  private registerIpcEvents(): void {
    window.electronAPI.onTrayStopDaemon((event: any) => {
      console.debug(event);
      this.disableAllItems();
      this.daemonService.isRunning().then((running: boolean) => {
        if (!running) {
          console.warn("Daemon already stopped");
          return;
        }

        this.daemonService.stopDaemon().then(() => {
          window.electronAPI.setTrayItemEnabled('stopDaemon', false);
          window.electronAPI.setTrayItemEnabled('startDaemon', true);
          window.electronAPI.setTrayItemEnabled('startSync', false);
          window.electronAPI.setTrayItemEnabled('stopSync', false);
        }).catch((error: any) => console.error(error));

      }).catch((error: any) => console.error(error));
    });

    window.electronAPI.onTrayStartDaemon((event: any) => {
      console.debug(event);
      this.disableAllItems();
      this.daemonService.isRunning().then((running: boolean) => {
        if (running) {
          console.warn("Daemon already started");
          return;
        }

        this.daemonService.startDaemon().then(() => {
          window.electronAPI.setTrayItemEnabled('stopDaemon', true);
          window.electronAPI.setTrayItemEnabled('startDaemon', false);
          window.electronAPI.setTrayItemEnabled('startSync', this.daemonService.settings.noSync);
          window.electronAPI.setTrayItemEnabled('stopSync', !this.daemonService.settings.noSync);
        }).catch((error: any) => console.error(error));

      }).catch((error: any) => console.error(error));
    });

    window.electronAPI.onTrayQuitDaemon((event: any) => {
      console.debug(event);
      this.disableAllItems();

      this.daemonService.quit().then(() => this.disableAllItems()).catch((error: any) => console.error(error));
    });

    window.electronAPI.onTrayStartSync((event: any) => {
      console.debug(event);
      if (!this.daemonService.settings.noSync) {
        console.warn("Sync already enabled");
        return;
      }

      this.disableAllItems();

      this.daemonService.enableSync().then(() => {
        window.electronAPI.setTrayItemEnabled('startSync', false);
        window.electronAPI.setTrayItemEnabled('stopSync', true);
      }).catch((error: any) => console.error(error));
    });

    window.electronAPI.onTrayStopSync((event: any) => {
      console.debug(event);
      if (this.daemonService.settings.noSync) {
        console.warn("Sync already disabled");
        return;
      }

      this.disableAllItems();

      this.daemonService.disableSync().then(() => {
        window.electronAPI.setTrayItemEnabled('startSync', true);
        window.electronAPI.setTrayItemEnabled('stopSync', false);
      }).catch((error: any) => console.error(error));
    });

    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.loadTrayItems(running);
    });
  }

  public disableAllItems(): void {
    window.electronAPI.setTrayItemEnabled('stopDaemon', false);
    window.electronAPI.setTrayItemEnabled('startDaemon', false);
    window.electronAPI.setTrayItemEnabled('startSync', false);
    window.electronAPI.setTrayItemEnabled('stopSync', false); 
  }

  public loadTrayItems(running: boolean): void {
    if (!running) {
      window.electronAPI.setTrayItemEnabled('stopDaemon', false);
      window.electronAPI.setTrayItemEnabled('startDaemon', true);
      window.electronAPI.setTrayItemEnabled('startSync', false);
      window.electronAPI.setTrayItemEnabled('stopSync', false); 
    }
    else {
      window.electronAPI.setTrayItemEnabled('stopDaemon', true);
      window.electronAPI.setTrayItemEnabled('startDaemon', false);
      window.electronAPI.setTrayItemEnabled('startSync', this.daemonService.settings.noSync);
      window.electronAPI.setTrayItemEnabled('stopSync', !this.daemonService.settings.noSync);
    }
  }
}
