import { AfterViewInit, Component, NgZone, inject } from '@angular/core';
import { NavbarPill } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { SimpleBootstrapCard } from '../../shared/utils';
import { DaemonDataService, ElectronService, MoneroInstallerService, TorDaemonService } from '../../core/services';
import { DaemonSettings, DaemonVersion } from '../../../common';
import { StringUtils } from '../../core/utils';

@Component({
    selector: 'app-version',
    templateUrl: './version.component.html',
    styleUrl: './version.component.scss',
    standalone: false
})
export class VersionComponent implements AfterViewInit {
  private daemonData = inject(DaemonDataService);
  private daemonService = inject(DaemonService);
  private electronService = inject(ElectronService);
  private moneroInstaller = inject(MoneroInstallerService);
  private torService = inject(TorDaemonService);
  private ngZone = inject(NgZone);

  public readonly links: NavbarPill[];
  public cards: SimpleBootstrapCard[];
  public torCards: SimpleBootstrapCard[];
  public currentVersion?: DaemonVersion;
  public latestVersion?: DaemonVersion;
  public currentTorVersion?: string;
  public latestTorVersion?: string;
  public settings: DaemonSettings = new DaemonSettings();
  public loading: boolean = true;

  public checkingLatestVersion: boolean = false;
  public upgradeSuccess: boolean = false;
  public upgradeError: string = '';
  public downloadStatus : string = '';
  
  public checkingLatestTorVersion: boolean = false;
  public upgradeTorSuccess: boolean = false;
  public upgradeTorError: string = '';
  public downloadTorStatus : string = '';

  public get downloadProgress(): string {
    const ratio = this.moneroInstaller.installing ? this.moneroInstaller.progress.progress : 0;

    return `${ratio <= 100 ? ratio.toFixed(2) : 100} %`;
  }

  public get configured(): boolean {
    return this.settings.monerodPath != '';
  }

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

    return 'Check Updates';
  }

  public get upgrading(): boolean {
    return this.moneroInstaller.upgrading;
  }

  public get installing(): boolean {
    return this.moneroInstaller.installing;
  }

  constructor() {
    this.links = [
      new NavbarPill('monero', 'Monero', true, false),
      new NavbarPill('tor', 'TOR', false, false)
    ];
    this.cards = this.createCards();
    this.torCards = this.createTorCards();
  }

  // #region Cards

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

  private createTorCards(): SimpleBootstrapCard[] {
    return [
      new SimpleBootstrapCard('Current TOR version', this.currentTorVersion ? this.currentTorVersion : 'Not found', this.loading || this.installing),
      new SimpleBootstrapCard('Latest TOR version', this.latestTorVersion ? this.latestTorVersion : 'Error', this.loading)
    ];
  }

  // #endregion

  public ngAfterViewInit(): void {
    this.load()
      .then(() => {
        this.cards = this.createCards();
        this.torCards = this.createTorCards();
      })
      .catch((error: any) => {
        console.error(error);
        this.currentVersion = undefined;
        this.latestVersion = undefined
        this.currentTorVersion = undefined;
        this.latestTorVersion = undefined;
        this.cards = this.createErrorCards();
        this.torCards = this.createTorCards();
      });
  }

  private async refreshCurrentVersion(): Promise<void> {
    try {
      this.currentVersion = await this.daemonService.getVersion(true);
    }
    catch(error: any) {
      console.error(error);
      this.currentVersion = undefined;
    }
  }

  private async refreshLatestVersion(force: boolean = false): Promise<void> {
    try {
      this.latestVersion = await this.daemonService.getLatestVersion(force);
    }
    catch(error: any) {
      console.error(error);
      this.latestVersion = undefined;
    }
  }

  private async refreshCurrentTorVersion(): Promise<void> {
    try {
      this.currentTorVersion = await this.torService.getVersion();
    }
    catch(error: any) {
      console.error(error);
      this.currentTorVersion = undefined;
    }
  }

  private async refreshLatestTorVersion(force: boolean = false): Promise<void> {
    if (!force && this.latestTorVersion !== undefined) return;
    
    try {
      this.latestTorVersion = await this.torService.getLatestVersion();
    }
    catch(error: any) {
      console.error(error);
      this.latestTorVersion = undefined;
    }
  }

  private refreshCards(error: boolean = false): void {
    if (error) {
      this.cards = this.createErrorCards();
      return;
    }

    this.cards = this.createCards();
    this.torCards = this.createTorCards();
  }

  public async load(): Promise<void> {
    await this.ngZone.run(async () => {
      this.loading = true;
  
      try {
        this.settings = await this.daemonService.getSettings();
        await this.refreshLatestVersion();
        await this.refreshCurrentVersion();
        await this.refreshCurrentTorVersion();
        await this.refreshLatestTorVersion();
      }
      catch(error: any) {
        console.error(error);
        this.cards = this.createErrorCards();
        this.torCards = this.createTorCards();

      }
  
      this.loading = false;
    });
  }

  public async checkLatestVersion(): Promise<void> {
    if (this.checkingLatestVersion) return;

    this.checkingLatestVersion = true;
    await this.refreshLatestVersion(true);

    setTimeout(() => { this.checkingLatestVersion = false; this.refreshCards() }, 500);
  }

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

  public async checkLatestTorVersion(): Promise<void> {
    if (this.checkingLatestTorVersion) return;

    this.checkingLatestTorVersion = true;
    await this.refreshLatestVersion(true);

    setTimeout(() => { this.checkingLatestTorVersion = false; this.refreshCards() }, 500);
  }

  public async upgradeTor(): Promise<void> {
    const implemented = false;

    const promise = new Promise<void>((resolve, reject) => {
      if (!implemented) reject(new Error("Not implemented"));
      else resolve();
    });

    await promise;
  }
}
