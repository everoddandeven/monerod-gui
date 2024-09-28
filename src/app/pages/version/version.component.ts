import { AfterViewInit, Component } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { SimpleBootstrapCard } from '../../shared/utils';
import { DaemonVersion } from '../../../common/DaemonVersion';
import { ElectronService, MoneroInstallerService } from '../../core/services';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrl: './version.component.scss'
})
export class VersionComponent implements AfterViewInit {
  private readonly links: NavbarLink[];
  public cards: SimpleBootstrapCard[];
  public currentVersion?: DaemonVersion;
  public latestVersion?: DaemonVersion;

  public downloadPath: string = '/home/sidney/monerod/';

  constructor(private navbarService: NavbarService, private daemonService: DaemonService, private electronService: ElectronService, private moneroInstaller: MoneroInstallerService) {
    this.links = [
      new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', true, 'Overview')
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
      this.navbarService.setLinks(this.links);
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
    const version = await this.daemonService.getVersion(this.electronService.isElectron);
    const latestVersion = await this.daemonService.getLatestVersion();

    this.currentVersion = version;
    this.latestVersion = latestVersion;
  }

  public downloadProgress: number = 100;
  public downloadStatus : string = '';

  public async upgrade(): Promise<void> {
    
    const downloadUrl = 'https://downloads.getmonero.org/cli/linux64'; // Cambia in base al sistema
    const destination = '/home/sidney/'; // Aggiorna con il percorso desiderato

    this.moneroInstaller.downloadMonero(downloadUrl, destination)
      .then(() => {
        console.log('Download completato con successo.');
      })
      .catch((error) => {
        console.error('Errore:', error);
      });
    
  }
}
