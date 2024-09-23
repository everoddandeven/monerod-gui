import { AfterViewInit, Component } from '@angular/core';
import { DaemonService } from '../core/services/daemon/daemon.service';
import { NavbarService } from '../navbar/navbar.service';
import { MinerData } from '../../common/MinerData';
import { NavigationEnd, Router } from '@angular/router';
import { NavbarLink } from '../navbar/navbar.model';
import { MineableTxBacklog } from '../../common/MineableTxBacklog';
import { Chain } from '../../common/Chain';
import { CoreIsBusyError } from '../../common/error';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-mining',
  templateUrl: './mining.component.html',
  styleUrl: './mining.component.scss'
})
export class MiningComponent implements AfterViewInit {

  private readonly navbarLinks: NavbarLink[];
  public coreBusy: boolean;
  private minerData?: MinerData;

  private majorVersion: number;
  private height: number;
  private prevId: string;
  private seedHash: string;
  private difficulty: number;
  private medianWeight: number;
  private alreadyGeneratedCoins: number;
  private alternateChains: Chain[];
  //private txBacklog: MineableTxBacklog[]
  public cards: Card[];

  constructor(private router: Router, private daemonService: DaemonService, private navbarService: NavbarService) {

    this.majorVersion = 0;
    this.height = 0;
    this.prevId = '';
    this.seedHash = '';
    this.difficulty = 0;
    this.medianWeight = 0;
    this.alreadyGeneratedCoins = 0;
    this.alternateChains = [];
    this.cards = [];
    this.coreBusy = false;

    this.navbarLinks = [
      new NavbarLink('pills-miner-data-tab', '#pills-miner-data', 'miner-data', true, 'Miner Data'),
      new NavbarLink('pills-alternate-chains-tab', '#pills-alternate-chains', 'alternate-chains', false, 'Alternate Chains'),
      new NavbarLink('pills-block-template-tab', '#pills-block-template', 'block-template', false, 'Block Template')
    ];

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url != '/mining') return;
        this.onNavigationEnd();
      }
    });
  }

  ngAfterViewInit(): void {
    console.log('DetailComponent AFTER VIEW INIT');
    this.navbarService.setNavbarLinks(this.navbarLinks);

    setTimeout(() => {
      const $table = $('#chainsTable');
      $table.bootstrapTable({});
      $table.bootstrapTable('refreshOptions', {
        classes: 'table table-bordered table-hover table-dark table-striped'
      });      
      this.load();

    }, 500);
  }

  private onNavigationEnd(): void {
    this.load().then(() => {
      this.cards = this.createCards();
    });
  }

  private async load(): Promise<void> {
    try {
      const running = await this.daemonService.isRunning();
      
      if (!running) {
        this.coreBusy = false;
        throw new Error("Daemon not running");
      }

      this.minerData = await this.daemonService.getMinerData();
      this.majorVersion = this.minerData.majorVersion;
      this.height = this.minerData.height;
      this.prevId = this.minerData.prevId;
      this.seedHash = this.minerData.seedHash;
      this.difficulty = this.minerData.difficulty;
      this.medianWeight = this.minerData.medianWeight;
      this.alreadyGeneratedCoins = this.minerData.alreadyGeneratedCoins;

      this.alternateChains = await this.daemonService.getAlternateChains();

      const $table = $('#chainsTable');
      $table.bootstrapTable('load', this.getChains());
      this.coreBusy = false;
      this.navbarService.enableNavbarLinks();
    }
    catch(error) {
      this.navbarService.disableNavbarLinks();
      if (error instanceof CoreIsBusyError) {
        this.coreBusy = true;
      }
    }
    
  }

  private createCards(): Card[] {
    if (this.coreBusy) {
      return [
      ]
    }
    return [
      new Card('Major Fork Version', `${this.majorVersion}`),
      new Card('Current block height', `${this.height}`),
      new Card('Previous Block Id', `${this.prevId}`),
      new Card('Seed hash', `${this.seedHash}`),
      new Card('Network difficulty', `${this.difficulty}`),
      new Card('Median block weight', `${this.medianWeight}`),
      new Card('Generated Coins', `${this.alreadyGeneratedCoins}`)
    ];
  }

  private getChains(): any[] {
    const chains: any[] = [];

    this.alternateChains.forEach((chain: Chain) => chains.push({
      'blockHash': chain.blockHash,
      'height': chain.height,
      'length': chain.length,
      'mainChainParentBlock': chain.mainChainParentBlock,
      'wideDifficulty': chain.wideDifficulty
    }))

    return chains;
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