import { AfterViewInit, Component, NgZone } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavigationEnd, Router } from '@angular/router';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { SimpleBootstrapCard } from '../../shared/utils';
import { DaemonDataService } from '../../core/services';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';

@Component({
  selector: 'app-hard-fork-info',
  templateUrl: './hard-fork-info.component.html',
  styleUrl: './hard-fork-info.component.scss'
})
export class HardForkInfoComponent implements AfterViewInit {
  public cards: SimpleBootstrapCard[];
  private earliestHeight: number;
  private enabled: boolean;
  private threshold: number;
  private blockVersion: number;
  private votes: number;
  private voting: number;
  private window: number;

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonService.stopping;
  }

  public loading: boolean = false;

  public readonly navbarLinks: NavbarLink[] = [
    new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', false, 'Overview'),
  ];

  constructor(private router: Router, private daemonData: DaemonDataService, private daemonService: DaemonService, private navbarService: NavbarService, private ngZone: NgZone) {
    this.cards = [];
    this.enabled = false;
    this.earliestHeight = 0;
    this.threshold = 0;
    this.blockVersion = 0;
    this.votes = 0;
    this.voting = 0;
    this.window = 0;

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url != '/hardforkinfo') return;
        this.onNavigationEnd();
      }
    });
  }

  ngAfterViewInit(): void {
      this.navbarService.setLinks(this.navbarLinks);
  }

  private onNavigationEnd(): void {
    this.load().then(() => {
      this.cards = this.createCards();
    }).catch((error: any) => {
      console.error(error);
    });
    
  }

  private async load(): Promise<void> {
    if (!await this.daemonService.isRunning()) {
      return;
    }
    this.cards = this.createCards();

    this.loading = true;

    try {
      const info = await this.daemonService.hardForkInfo();

      this.earliestHeight = info.earliestHeight;
      this.threshold = info.threshold;
      this.blockVersion = info.version;
      this.votes = info.votes;
      this.voting = info.voting;
      this.window = info.window;
    }
    catch(error) {
      console.error(error);
    }

    this.loading = false;
  }

  private createCards(): SimpleBootstrapCard[] {
    return [
      new SimpleBootstrapCard('Status', this.enabled ? 'enabled' : 'disabled'),
      new SimpleBootstrapCard('Earliest height', `${this.earliestHeight}`),
      new SimpleBootstrapCard('Threshold', `${this.threshold}`),
      new SimpleBootstrapCard('Block version', `${this.blockVersion}`),
      new SimpleBootstrapCard('Votes', `${this.votes}`),
      new SimpleBootstrapCard('Voting', `${this.voting}`),
      new SimpleBootstrapCard('Window', `${this.window}`)
    ]
  }

}
