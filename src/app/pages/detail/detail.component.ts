import { Component, OnInit, AfterViewInit, NgZone, OnDestroy } from '@angular/core';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { SyncInfo } from '../../../common/SyncInfo';
import { Peer } from '../../../common/Peer';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavigationEnd, Router } from '@angular/router';
import { DaemonInfo } from '../../../common/DaemonInfo';


import { LogsService } from '../logs/logs.service';
import { ElectronService } from '../../core/services';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, AfterViewInit, OnDestroy {

  public daemonRunning: boolean;
  public startingDaemon: boolean;
  public stoppingDaemon: boolean;
  private syncInfo?: SyncInfo;
  private daemonInfo?: DaemonInfo;
  public readonly navbarLinks: NavbarLink[];

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

  private loadInterval?: any;

  public get loading(): boolean {
    return this.isLoading;
  }

  public cards: Card[];

  constructor(
    private router: Router,private daemonService: DaemonService, 
    private navbarService: NavbarService, private logsService: LogsService, 
    private ngZone: NgZone, private electronService: ElectronService) {
    this.daemonRunning = false;
    this.startingDaemon = false;
    this.stoppingDaemon = false;
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
    this.isLoading = false;

    this.navbarLinks = [
      new NavbarLink('pills-home-tab', '#pills-home', 'pills-home', true, 'Overview', true),
      new NavbarLink('pills-profile-tab', '#pills-profile', 'pills-profile', false, 'Peers', true),
      new NavbarLink('pills-spans-tab', '#pills-spans', 'pills-spans', false, 'Spans', true)
    ];

    this.cards = this.createLoadingCards();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url != '/detail') return;
        //this.onNavigationEnd();
      }
    });

    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      this.ngZone.run(() => {
        this.daemonRunning = running;
        if (!running && this.stoppingDaemon) {
          this.stoppingDaemon = false;
        }
      })
    });
   }

  ngOnInit(): void {
    console.log('DetailComponent INIT');
      
  }

  ngAfterViewInit(): void {
    console.log('DetailComponent AFTER VIEW INIT');
    this.navbarService.setLinks(this.navbarLinks);
      setTimeout(() => {
        this.ngZone.run(() => {

          const $table = $('#table');
          $table.bootstrapTable({});
          $table.bootstrapTable('refreshOptions', {
            classes: 'table table-bordered table-hover table-dark table-striped'
          });
          $table.bootstrapTable('showLoading');
          /*
          $table.bootstrapTable('refreshOptions', {
            classes: 'table table-bordered table-hover table-dark table-striped'
          });
          */
        });
      }, 1000);
    
    
    if (this.loadInterval != null) return;
    
    this.ngZone.run(() => {
      this.load().then(() => {
        this.cards = this.createCards();
      });
    });
    
    this.loadInterval = setInterval(() => {
      /*
      const $table = $('#table');
      $table.bootstrapTable({});
      $table.bootstrapTable('refreshOptions', {
        classes: 'table table-bordered table-hover table-dark table-striped'
      });
      */
      if (this.stoppingDaemon) return;

      this.ngZone.run(() => {

        this.load().then(() => {
          this.cards = this.createCards();
        });
        }, 5000);
      })

      
  }

  ngOnDestroy(): void {
      console.log("DetailComponent ON DESTROY");
      
      if(this.loadInterval != null) {
        clearInterval(this.loadInterval);
      }
  }

  public async startDaemon(): Promise<void> {
    if (this.daemonRunning) {
      console.warn("Daemon already running");
      return;
    }

    if (this.startingDaemon || this.stoppingDaemon) {
      return;
    }

    this.startingDaemon = true;

    setTimeout(async () => {
      try {
        await this.daemonService.startDaemon();
        this.daemonRunning = await this.daemonService.isRunning();
      }
      catch(error) {
        console.error(error);
        this.daemonRunning = false;
      }

      this.cards = this.createLoadingCards();
  
      this.startingDaemon = false;
    }, 500);
  }

  public async stopDaemon(): Promise<void> {
    if (this.stoppingDaemon || this.startingDaemon || !this.daemonRunning) {
      return;
    }

    this.stoppingDaemon = true;

    try {
      if (this.loadInterval) clearInterval(this.loadInterval);

      await this.daemonService.stopDaemon();

      if(!this.electronService.isElectron) this.daemonRunning = false;
    }
    catch (error) {
      console.error(error);
    }

    if(!this.electronService.isElectron) this.stoppingDaemon = false;
  }

  private createLoadingCards(): Card[] {
    return [
      new Card('Connection Status', this.connectionStatus, true),
      new Card('Network Type', this.networkType, true),
      new Card('Node Type', this.nodeType, true),
      new Card('Sync progress', this.syncProgress, true),
      new Card('Scan Height', `${this.height} / ${this.targetHeight}`, true),
      new Card('Next needed pruning seed', `${this.nextNeededPruningSeed}`, true),
      new Card('Block count', `${this.blockCount}`, true),
      new Card('Monero version', this.version, true),
      new Card('Blockchain size', this.blockchainSize, true),
      new Card('Disk usage', this.diskUsage, true),
      new Card('Transaction count', `${this.txCount}`, true),
      new Card('Pool size', `${this.poolSize}`, true)
    ];
  }

  private createCards(): Card[] {
    if (!this.daemonRunning && !this.daemonService.starting) {
      return [];
    }
    if (this.isLoading || this.daemonService.starting) {
      return this.createLoadingCards();
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
    if (this.isLoading) {
      return;
    }

    try {
      this.isLoading = true;
      this.daemonRunning = await this.daemonService.isRunning();

      if (!this.daemonRunning) {
        this.navbarService.disableLinks();
        this.isLoading = false;
        return;
      }

      this.navbarService.enableLinks();

      const $table = $('#table');
      $table.bootstrapTable({});
      $table.bootstrapTable('refreshOptions', {
        classes: 'table table-bordered table-hover table-dark table-striped'
      });
      if (this.getPeers().length == 0) $table.bootstrapTable('showLoading');
      
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

      //const version = await this.daemonService.getVersion();

      //this.version = `${version.version}`;

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

      const blockchainPruned = await this.isBlockchainPruned();
      //const blockchainPruned = false;
      this.nodeType = blockchainPruned ? 'pruned' : 'full';
      $table.bootstrapTable('load', this.getPeers());
      $table.bootstrapTable('hideLoading');

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
  public loading: boolean;

  constructor(header: string, content: string, loading: boolean = false) {
    this.header = header;
    this.content = content;
    this.loading = loading;
  }
}