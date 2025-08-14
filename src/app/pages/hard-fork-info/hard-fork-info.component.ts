import { AfterViewInit, Component, NgZone, inject } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { SimpleBootstrapCard } from '../../shared/utils';
import { DaemonDataService } from '../../core/services';
import { NavbarPill } from '../../shared/components/navbar/navbar.model';
import { BasePageComponent } from '../base-page/base-page.component';

@Component({
    selector: 'app-hard-fork-info',
    templateUrl: './hard-fork-info.component.html',
    styleUrl: './hard-fork-info.component.scss',
    standalone: false
})
export class HardForkInfoComponent extends BasePageComponent implements AfterViewInit {
  private daemonData = inject(DaemonDataService);
  private daemonService = inject(DaemonService);
  private ngZone = inject(NgZone);

  public cards: SimpleBootstrapCard[];
  private earliestHeight: number;
  private enabled: boolean;
  private threshold: number;
  private blockVersion: number;
  private votes: number;
  private voting: number;
  private window: number;
  private state?: number;

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonService.stopping;
  }

  public get hardForkState(): string {
    const state = this.state;

    if (state == 0) {
      return 'There is likely a hard fork';
    }
    else if (state == 1) {
      return 'An update is needed to fork properly';
    }

    return '';
  }

  public loading: boolean = false;

  constructor() {
    super();

    this.setLinks([
      new NavbarPill('overview', 'Overview'),
    ]);
    this.cards = [];
    this.enabled = false;
    this.earliestHeight = 0;
    this.threshold = 0;
    this.blockVersion = 0;
    this.votes = 0;
    this.voting = 0;
    this.window = 0;
  }

  public ngAfterViewInit(): void {
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
      this.enabled = info.enabled;
      this.state = info.state;
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
