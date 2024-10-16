import { Component } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
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
  public loading: boolean;
  public daemonRunning: boolean;

  public get initializing(): boolean {
    return this.daemonData.initializing;
  }

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private daemonService: DaemonService,
    private daemonData: DaemonDataService,
    private LogService: LogsService
  ) {
    this.translate.setDefaultLang('en');
    console.log('APP_CONFIG', APP_CONFIG);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('Run in browser');
    }

    this.loading = false;
    this.daemonRunning = false;
    this.load();
  }

  private load(): void {
    this.loading = true;

    this.daemonService.isRunning().then((running: boolean) => {
      this.daemonRunning = running;
      this.loading;
    }).catch((error) => {
      console.error(error);
      this.daemonRunning = false;
    }).finally(() => {
      this.loading = false;
    });

    this.loading = false;
  }
}
