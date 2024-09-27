import { AfterViewInit, Component } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { SimpleBootstrapCard } from '../../shared/utils';
import { DaemonVersion } from '../../../common/DaemonVersion';
import { ElectronService } from '../../core/services';

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

  constructor(private navbarService: NavbarService, private daemonService: DaemonService, private electronService: ElectronService) {
    this.links = [
      new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', true, 'Overview')
    ];
    this.cards = this.createCards();
  }

  private createCards(): SimpleBootstrapCard[] {
    return [
      new SimpleBootstrapCard('Current version', this.currentVersion ? this.currentVersion.fullname : '', this.currentVersion == null),
      new SimpleBootstrapCard('Latest version', this.latestVersion ? this.latestVersion.fullname : '', this.latestVersion == null)
    ];
  }

  private createErrorCards(): SimpleBootstrapCard[] {
    return [
      new SimpleBootstrapCard('Current version', 'Error', false), 
      new SimpleBootstrapCard('Latest version', 'Error', false)
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

}
