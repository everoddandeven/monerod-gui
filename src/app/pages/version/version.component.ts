import { AfterViewInit, Component } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { SimpleBootstrapCard } from '../../shared/utils';
import { DaemonVersion } from '../../../common/DaemonVersion';
import { DaemonDataService, ElectronService, MoneroInstallerService } from '../../core/services';
import { DaemonSettings } from '../../../common';

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

  constructor(private daemonData: DaemonDataService, private daemonService: DaemonService, private electronService: ElectronService, private moneroInstaller: MoneroInstallerService) {
    this.links = [
      new NavbarLink('pills-monero-tab', '#pills-monero', 'pills-monero', true, 'Monero')
    ];
    this.cards = this.createCards();
  }

  private createCards(): SimpleBootstrapCard[] {
    return [
      new SimpleBootstrapCard('GUI Version', this.daemonService.getGuiVersion()),
      new SimpleBootstrapCard('Current Monerod version', this.currentVersion ? this.currentVersion.fullname : '', this.currentVersion == null),
      new SimpleBootstrapCard('Latest Monerod version', this.latestVersion ? this.latestVersion.fullname : '', this.latestVersion == null)
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

  public async load(): Promise<void> {
    this.loading = true;

    try {
      this.settings = await this.daemonService.getSettings();
      const isElectron = this.electronService.isElectron || (window as any).electronAPI != null;
      const version = await this.daemonService.getVersion(isElectron);
      const latestVersion = await this.daemonService.getLatestVersion();
  
      this.currentVersion = version;
      this.latestVersion = latestVersion;
    }
    catch(error: any) {
      console.error(error);
      this.cards = this.createErrorCards();
    }

    this.loading = false;
  }

  public get upgrading(): boolean {
    return this.moneroInstaller.upgrading;
  }

  public get installing(): boolean {
    return this.moneroInstaller.installing;
  }

  public upgradeSuccess: boolean = false;
  public upgradeError: string = '';
  public downloadProgress: number = 100;
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
    }
    catch(error: any) {
      
      console.error(error);
      this.upgradeSuccess = false;
      this.upgradeError = `${error}`;
    }
  }
}
