import { AfterViewInit, Component } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavigationEnd, Router } from '@angular/router';
import { NavbarService } from '../../shared/components/navbar/navbar.service';

@Component({
  selector: 'app-hard-fork-info',
  templateUrl: './hard-fork-info.component.html',
  styleUrl: './hard-fork-info.component.scss'
})
export class HardForkInfoComponent implements AfterViewInit {
  public cards: Card[];
  private earliestHeight: number;
  private enabled: boolean;
  private threshold: number;
  private blockVersion: number;
  private votes: number;
  private voting: number;
  private window: number;

  constructor(private router: Router, private daemonService: DaemonService, private navbarService: NavbarService) {
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
      this.navbarService.removeNavbarLinks();
  }

  private onNavigationEnd(): void {
    this.load().then(() => {
      this.cards = this.createCards();
    });
    
  }

  private async load(): Promise<void> {
    const info = await this.daemonService.hardForkInfo();

    this.earliestHeight = info.earliestHeight;
    this.threshold = info.threshold;
    this.blockVersion = info.version;
    this.votes = info.votes;
    this.voting = info.voting;
    this.window = info.window;
  }

  private createCards(): Card[] {
    return [
      new Card('Status', this.enabled ? 'enabled' : 'disabled'),
      new Card('Earliest height', `${this.earliestHeight}`),
      new Card('Threshold', `${this.threshold}`),
      new Card('Block version', `${this.blockVersion}`),
      new Card('Votes', `${this.votes}`),
      new Card('Voting', `${this.voting}`),
      new Card('Window', `${this.window}`)
    ]
  }

}

class Card {
  public header: string;
  public content: string;

  constructor(header: string, content: string) {
    this.header = header;
    this.content = content;
  }
}