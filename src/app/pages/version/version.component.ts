import { AfterViewInit, Component, NgZone } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { SimpleBootstrapCard } from '../../shared/utils';
import { DaemonDataService, ElectronService, MoneroInstallerService } from '../../core/services';
import { DaemonSettings, DaemonVersion } from '../../../common';
import { StringUtils } from '../../core/utils';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrl: './version.component.scss'
})
export class VersionComponent implements AfterViewInit {
  public readonly links: NavbarLink[];
  public cards: SimpleBootstrapCard[];
  public currentVersion?: DaemonVersion;
  public latestVersion?: DaemonVersion;
  public settings: DaemonSettings = new DaemonSettings();

  public get buttonDisabled(): boolean {
    const title = this.buttonTitle;
    
    if (title == 'Install') {
      return false;
    }

    const configured = this.settings.monerodPath != '';
    const updateAvailable = this.daemonData.info ? this.daemonData.info.updateAvailable : false;

    if (title == 'Upgrade' && configured && updateAvailable) {
      return false;
    }

    return true;
  }

  public get buttonTitle(): string {
    const updateAvailable = this.daemonData.info ? this.daemonData.info.updateAvailable : false;

    if (updateAvailable) {
      return 'Upgrade';
    }

    const notConfigured = this.settings.monerodPath == '';

    if (notConfigured) {
      return 'Install';
    }

    return 'Upgrade';
  }

  constructor(private daemonData: DaemonDataService, private daemonService: DaemonService, private electronService: ElectronService, private moneroInstaller: MoneroInstallerService, private ngZone: NgZone) {
    this.links = [
      new NavbarLink('pills-monero-tab', '#pills-monero', 'pills-monero', true, 'Monero')
    ];
    this.cards = this.createCards();
  }

  private createCards(): SimpleBootstrapCard[] {
    return [
      new SimpleBootstrapCard('GUI Version', this.daemonService.getGuiVersion()),
      new SimpleBootstrapCard('Current Monerod version', this.currentVersion ? this.currentVersion.fullname : 'Not found', this.loading || this.installing),
      new SimpleBootstrapCard('Latest Monerod version', this.latestVersion ? this.latestVersion.fullname : 'Error', this.loading)
    ];
  }

  private createErrorCards(): SimpleBootstrapCard[] {
    return [
      new SimpleBootstrapCard('GUI Version', this.daemonService.getGuiVersion())
    ];
  }

  public ngAfterViewInit(): void {
    this.load()
      .then(() => {
        this.cards = this.createCards();
      })
      .catch((error: any) => {
        console.error(error);
        this.currentVersion = undefined;
        this.latestVersion = undefined
        this.cards = this.createErrorCards();
      });
  }

  public loading: boolean = true;

  private async refreshCurrentVersion(): Promise<void> {
    try {
      this.currentVersion = await this.daemonService.getVersion(true);
    }
    catch(error: any) {
      console.error(error);
      this.currentVersion = undefined;
    }
  }

  private async refreshLatestVersion(): Promise<void> {
    try {
      this.latestVersion = await this.daemonService.getLatestVersion();
    }
    catch(error: any) {
      console.error(error);
      this.latestVersion = undefined;
    }
  }

  public async load(): Promise<void> {
    await this.ngZone.run(async () => {
      this.loading = true;
  
      try {
        this.settings = await this.daemonService.getSettings();
        await this.refreshLatestVersion();
        await this.refreshCurrentVersion();
      }
      catch(error: any) {
        console.error(error);
        this.cards = this.createErrorCards();
      }
  
      this.loading = false;
    });
  }

  public get upgrading(): boolean {
    return this.moneroInstaller.upgrading;
  }

  public get installing(): boolean {
    return this.moneroInstaller.installing;
  }

  public upgradeSuccess: boolean = false;
  public upgradeError: string = '';
  
  public get downloadProgress(): string {
    const ratio = this.moneroInstaller.installing ? this.moneroInstaller.progress.progress : 0;

    return `${ratio <= 100 ? ratio.toFixed(2) : 100} %`;
  }

  public downloadStatus : string = '';

  public async upgrade(): Promise<void> {
    if (this.upgrading || this.installing) {
      this.upgradeSuccess = false;
      this.upgradeError = `Daemon is already upgrading`;
      return;
    }

    try {    
      const settings = await this.daemonService.getSettings();

      if (settings.downloadUpgradePath == '') {
        settings.downloadUpgradePath = await this.electronService.selectFolder();
        if (settings.downloadUpgradePath != '') {
          await this.daemonService.saveSettings(settings, true);
        }
        else {
          throw new Error("Must select a valid download path before installing");
        }
      }

      await this.daemonService.upgrade();

      this.upgradeError = '';
      this.upgradeSuccess = true;

      await this.load();
    }
    catch(error: any) {
      
      console.error(error);
      this.upgradeSuccess = false;
      const err = StringUtils.replaceAll(`${error}`, 'Error: ','');

      if (err.includes('permission denied') || err.includes('operation not permitted')) {
        const settings = await this.daemonService.getSettings();
        
        this.upgradeError = `Cannot download monerod to <strong>${settings.downloadUpgradePath}</strong> due to insufficient permissions`;

        settings.downloadUpgradePath = '';

        await this.daemonService.saveSettings(settings);
      }
      else {
        this.upgradeError = err;
      }

    }
  }
}
