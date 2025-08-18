import { Component, inject, AfterViewInit } from '@angular/core';
import { ElectronService } from './core/services';
import { DaemonService } from './core/services/daemon/daemon.service';
import { DaemonDataService } from './core/services/daemon/daemon-data.service';
import { LogsService } from './pages/logs/logs.service';
import { DaemonTrayService } from './core/services/daemon/daemon-tray.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements AfterViewInit {
  private electronService = inject(ElectronService);
  private daemonService = inject(DaemonService);
  private daemonData = inject(DaemonDataService);
  private LogService = inject(LogsService);
  private trayService = inject(DaemonTrayService);

  public loading: boolean = false;
  public daemonRunning: boolean = false;

  public get initializing(): boolean {
    return this.daemonData.initializing;
  }

  public ngAfterViewInit(): void {
    console.log("LOADING APP");
    this.load().then().catch((error: any) => console.error(error));
  }  

  private async load(): Promise<void> {
    this.loading = true;

    try {
      console.log("BEFORE LOAD SETTINGS");
      await this.daemonService.loadSettings();
      console.log("LOADED SETTINGS, RPC PORT: " + this.daemonService.settings.rpcBindPort);
      console.log("CHECKING IS RUNNING ...");
      this.daemonRunning = await this.daemonService.isRunning(true);
      await this.daemonData.checkDaemon();
      console.log("DAEMON IS RUNNING: " + this.daemonRunning);
      const isAutoLaunched = await this.electronService.isAutoLaunched();

      if (isAutoLaunched) {
        await this.daemonService.startDaemon();
      }

      this.trayService.loadTrayItems(this.daemonRunning)

    } catch (error: any) {
      console.error("LOAD ERROR", error);
      this.daemonRunning = false;
    }

    this.loading = false;
  }
}
