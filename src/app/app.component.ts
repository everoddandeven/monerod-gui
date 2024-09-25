import { Component } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import { DaemonService } from './core/services/daemon/daemon.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public loading: boolean;
  public daemonRunning: boolean;

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private daemonService: DaemonService
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

  private async load(): Promise<void> {
    this.loading = true;

    if (!window.indexedDB) {
      console.log("Il tuo browser non supporta indexedDB");
    }
    else {
      console.log("Browser supports IndexedDB");
      var request = window.indexedDB.open("dati", 1);
      console.log(request);

      request.onsuccess = function(event: Event) {
        if(event.target instanceof IDBOpenDBRequest) {
          console.log(event.target.result)
        }
      };
    }

    try {
      this.daemonRunning = await this.daemonService.isRunning();
    }
    catch(error) {
      console.error(error);
    }

    this.loading = false;
  }
}
