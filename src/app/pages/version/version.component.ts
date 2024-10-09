import { AfterViewInit, Component } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { SimpleBootstrapCard } from '../../shared/utils';
import { DaemonVersion } from '../../../common/DaemonVersion';
import { DaemonDataService, ElectronService, MoneroInstallerService } from '../../core/services';

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

  public downloadPath: string = '/home/sidney/monerod/';

  public get buttonDisabled(): boolean {
    const title = this.buttonTitle;
    
    if (title == 'Install') {
      return false;
    }

    const configured = this.daemonService.settings.monerodPath != '';
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

    const notConfigured = this.daemonService.settings.monerodPath == '';

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
      new SimpleBootstrapCard('GUI Version', this.daemonService.getGuiVersion()),
      new SimpleBootstrapCard('Current Monerod version', 'Error', false), 
      new SimpleBootstrapCard('Latest Monerod version', 'Error', false)
    ];
  }

  public ngAfterViewInit(): void {
    this.upgrading = this.moneroInstaller.upgrading;
    this.load()
      .then(() => {
        this.cards = this.createCards();
      })
      .catch((error: any) => {
        this.currentVersion = undefined;
        this.latestVersion = undefined
        this.cards = this.createErrorCards();
      });
  }

  public async load(): Promise<void> {
    const isElectron = this.electronService.isElectron || (window as any).electronAPI != null;
    const version = await this.daemonService.getVersion(isElectron);
    const latestVersion = await this.daemonService.getLatestVersion();

    this.currentVersion = version;
    this.latestVersion = latestVersion;
  }

  public upgrading: boolean = false;
  public upgradeSuccess: boolean = false;
  public upgradeError: string = '';
  public downloadProgress: number = 100;
  public downloadStatus : string = '';

  public async upgrade(): Promise<void> {
    if (this.upgrading) {
      console.warn("Already upgrading");
      return;
    }

    this.upgrading = true;
    try {    
      const settings = await this.daemonService.getSettings();
      if (settings.upgradeAutomatically) {
        throw new Error('Monero Daemon will upgrade automatically');
      }
      if (settings.downloadUpgradePath == '') {
        throw new Error("Download path not configured");
      }

      const downloadUrl = 'https://downloads.getmonero.org/cli/linux64'; // Cambia in base al sistema
      const destination = settings.downloadUpgradePath; // Aggiorna con il percorso desiderato
  
      const moneroFolder = await this.moneroInstaller.downloadMonero(downloadUrl, destination);
      
      settings.monerodPath = `${moneroFolder}/monerod`;

      await this.daemonService.saveSettings(settings);

      this.upgradeError = '';
      this.upgradeSuccess = true;
    }
    catch(error) {
      console.error(error);
      this.upgradeSuccess = false;
      this.upgradeError = `${error}`;
    }

    this.upgrading = false;
  }
}
