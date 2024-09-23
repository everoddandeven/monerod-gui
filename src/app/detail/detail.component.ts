import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { DaemonService } from '../core/services/daemon/daemon.service';
import { SyncInfo } from '../../common/SyncInfo';
import { Peer } from '../../common/Peer';
import { NavbarLink } from '../navbar/navbar.model';
import { NavbarService } from '../navbar/navbar.service';
import { NavigationEnd, Router } from '@angular/router';
import { DaemonInfo } from '../../common/DaemonInfo';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, AfterViewInit {

  public daemonRunning: boolean;
  private syncInfo?: SyncInfo;
  private daemonInfo?: DaemonInfo;
  private readonly navbarLinks: NavbarLink[];

  private syncStatus: string;
  private height: number;
  private targetHeight: number;
  private nextNeededPruningSeed: number;
  private overview: string;
  private blockCount: number;
  private version: string;
  
  private blockchainSize: string;
  private diskUsage: string;
  private networkType: string;
  private connectionStatus: string;
  private txCount: number;
  private poolSize: number;
  private nodeType: string;
  private syncProgress: string;

  private isLoading: boolean;

  public get loading(): boolean {
    return this.isLoading;
  }

  public cards: Card[];

  constructor(private router: Router,private daemonService: DaemonService, private navbarService: NavbarService, private ngZone: NgZone) {
    this.daemonRunning = false;
    this.syncStatus = 'Not synced';
    this.height = 0;
    this.targetHeight = 0;
    this.nextNeededPruningSeed = 0;
    this.overview = '';
    this.blockCount = 0;
    this.version = '';
    this.diskUsage = '0 %';
    this.networkType = '';
    this.connectionStatus = 'offline';
    this.txCount = 0;
    this.poolSize = 0;
    this.nodeType = 'unknown';
    this.blockchainSize = '0 GB';
    this.syncProgress = '0 %';
    this.isLoading = true;

    this.navbarLinks = [
      new NavbarLink('pills-home-tab', '#pills-home', 'pills-home', true, 'Overview', true),
      new NavbarLink('pills-profile-tab', '#pills-profile', 'pills-profile', false, 'Peers', true)
    ];

    this.cards = [];

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url != '/detail') return;
        this.onNavigationEnd();
      }
    });
   }

  ngOnInit(): void {
    console.log('DetailComponent INIT');
  }

  ngAfterViewInit(): void {
    console.log('DetailComponent AFTER VIEW INIT');
    this.navbarService.setNavbarLinks(this.navbarLinks);

    setTimeout(() => {
      this.ngZone.run(() => {
        const $table = $('#table');
        $table.bootstrapTable({});
        $table.bootstrapTable('refreshOptions', {
          classes: 'table table-bordered table-hover table-dark table-striped'
        });      
        this.load();
  
      }, 500);
      });
  }

  public async startDaemon(): Promise<void> {
    if (this.daemonRunning) {
      console.warn("Daemon already running");
      return;
    }

    await this.daemonService.startDaemon();
    this.daemonRunning = await this.daemonService.isRunning();
  }

  private onNavigationEnd(): void {
    this.load().then(() => {
      this.cards = this.createCards();
    });
    
  }

  private createCards(): Card[] {
    if (!this.daemonRunning) {
      return []
    }
    return [
      new Card('Connection Status', this.connectionStatus),
      new Card('Network Type', this.networkType),
      new Card('Node Type', this.nodeType),
      new Card('Sync progress', this.syncProgress),
      new Card('Scan Height', `${this.height} / ${this.targetHeight}`),
      new Card('Next needed pruning seed', `${this.nextNeededPruningSeed}`),
      new Card('Block count', `${this.blockCount}`),
      new Card('Monero version', this.version),
      new Card('Blockchain size', this.blockchainSize),
      new Card('Disk usage', this.diskUsage),
      new Card('Transaction count', `${this.txCount}`),
      new Card('Pool size', `${this.poolSize}`)
    ];
  }

  private async load(): Promise<void> {
    try {
      this.isLoading = true;
      this.daemonRunning = await this.daemonService.isRunning();

      if (!this.daemonRunning) {
        this.navbarService.disableNavbarLinks();
        this.isLoading = false;
        return;
      }

      this.navbarService.enableNavbarLinks();

      const $table = $('#table');
      
      this.syncInfo = await this.daemonService.syncInfo();
      this.height = this.syncInfo.height;
      this.targetHeight = this.syncInfo.targetHeight;
      this.nextNeededPruningSeed = this.syncInfo.nextNeededPruningSeed;

      if (this.height > 0 && this.targetHeight == 0) {
        this.targetHeight = this.height;
        this.syncStatus = 'Daemon synced';
      }
      else if (this.height > 0 && this.targetHeight > 0 && this.height == this.targetHeight) {
        this.syncStatus = 'Daemon synced';
      }

      this.overview = this.syncInfo.overview;

      const blockCount = await this.daemonService.getBlockCount();

      this.blockCount = blockCount.count;

      const version = await this.daemonService.getVersion();

      this.version = `${version.version}`;

      this.daemonInfo = await this.daemonService.getInfo();

      const capacity: number = this.daemonInfo.freeSpace + this.daemonInfo.databaseSize;
      const diskUsage = parseInt(`${this.daemonInfo.databaseSize * 100 / capacity}`);
      const blockchainSize = (this.daemonInfo.databaseSize / 1000 / 1000 / 1000).toFixed(2);
      this.blockchainSize = `${blockchainSize} GB`;
      this.diskUsage = `${diskUsage} %`;
      this.networkType = this.daemonInfo.nettype;
      this.connectionStatus = this.daemonInfo.offline ? 'offline' : 'online';
      this.txCount = this.daemonInfo.txCount;
      this.poolSize = this.daemonInfo.txPoolSize;
      this.version = this.daemonInfo.version;
      this.syncProgress = `${(this.height*100/this.targetHeight).toFixed(2)} %`;

      //const blockchainPruned = await this.isBlockchainPruned();
      const blockchainPruned = false;
      this.nodeType = blockchainPruned ? 'pruned' : 'full';
      $table.bootstrapTable('load', this.getPeers());
    }
    catch(error) {
      console.error(error);
    }
    
    this.isLoading = false;
  }

  public async isBlockchainPruned(): Promise<boolean> {
    const result = await this.daemonService.pruneBlockchain(true);

    return result.pruned;
  }

  public getPeers(): any[] {
    if (!this.syncInfo) return [];

    const peers: any[] = [];
    
    this.syncInfo.peers.forEach((peer: Peer) => peers.push({
      'address': peer.info.address,
      'peerId': peer.info.peerId,
      'height': peer.info.height,
      'pruningSeed': peer.info.pruningSeed,
      'state': peer.info.state,
      'currentDownload': `${peer.info.currentDownload / 1000} kB/s`
    }));

    return peers;
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