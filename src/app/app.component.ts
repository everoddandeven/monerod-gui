import { Component } from '@angular/core';
import { ElectronService } from './core/services';
import { APP_CONFIG } from '../environments/environment';
import { DaemonService } from './core/services/daemon/daemon.service';
import { DaemonDataService } from './core/services/daemon/daemon-data.service';
import { LogsService } from './pages/logs/logs.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public loading: boolean = false;
  public daemonRunning: boolean = false;

  public get initializing(): boolean {
    return this.daemonData.initializing;
  }

  constructor(
    private electronService: ElectronService,
    private daemonService: DaemonService,
    private daemonData: DaemonDataService,
    private LogService: LogsService
  ) {
    console.log('APP_CONFIG', APP_CONFIG);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('Run in browser');
    }

    this.load().then().catch((error: any) => console.error(error));
  }

  private async isAutoLaunched(): Promise<boolean> {
    try {
      const promise = new Promise<boolean>((resolve) => {
        window.electronAPI.onIsAutoLaunched((event: any, isAutoLaunched: boolean) => {
          console.debug(event);
          window.electronAPI.unregisterOnIsAutoLaunched();
          resolve(isAutoLaunched);
        });
      });

      window.electronAPI.isAutoLaunched();

      return await promise;
    } catch(error: any) {
      console.error(error);
      return false;
    }
  }

  private async load(): Promise<void> {
    this.loading = true;

    try {
      this.daemonRunning = await this.daemonService.isRunning(true);

      const isAutoLaunched = await this.isAutoLaunched();

      if (isAutoLaunched) {
        await this.daemonService.startDaemon();
      }

    } catch {
      this.daemonRunning = false;
    }

    this.loading = false;
  }
}
