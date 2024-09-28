import { AfterViewInit, Component, NgZone } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavigationEnd, Router } from '@angular/router';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { SimpleBootstrapCard } from '../../shared/utils';

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

  public daemonRunning: boolean;

  public loading: boolean = false;

  constructor(private router: Router, private daemonService: DaemonService, private navbarService: NavbarService, private ngZone: NgZone) {
    this.cards = [];
    this.enabled = false;
    this.earliestHeight = 0;
    this.threshold = 0;
    this.blockVersion = 0;
    this.votes = 0;
    this.voting = 0;
    this.window = 0;
    this.daemonRunning = false;

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url != '/hardforkinfo') return;
        this.onNavigationEnd();
      }
    });

    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.daemonRunning = running;
    });

    this.daemonService.isRunning().then((running: boolean) => {
      this.ngZone.run(() => {
        this.daemonRunning = running;
      });
    });

  }

  ngAfterViewInit(): void {
      this.navbarService.removeLinks();
  }

  private onNavigationEnd(): void {
    this.load().then(() => {
      this.cards = this.createCards();
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
