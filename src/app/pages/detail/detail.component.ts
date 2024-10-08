import { Component, AfterViewInit, NgZone } from '@angular/core';
import { Peer } from '../../../common/Peer';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { DaemonService, DaemonDataService } from '../../core/services';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements AfterViewInit {

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get startingDaemon(): boolean {
    return this.daemonData.starting;
  }

  public get stoppingDaemon(): boolean {
    return this.daemonData.stopping;
  }

  public readonly navbarLinks: NavbarLink[];

  //private get syncStatus: string;

  //#region Sync Info

  private get height(): number {
    return this.daemonData.syncInfo ? this.daemonData.syncInfo.height : 0;
  }

  private get targetHeight(): number {
    const value = this.daemonData.syncInfo ? this.daemonData.syncInfo.targetHeight : 0;

    if (value == 0 && this.height > 0) {
      return this.height;
    }

    return value;
  }

  private get nextNeededPruningSeed(): number {
    return this.daemonData.syncInfo ? this.daemonData.syncInfo.nextNeededPruningSeed : 0;
  }

  private get overview(): string {
    return this.daemonData.syncInfo ? this.daemonData.syncInfo.overview : '[]';
  }

  //#endregion

  private get blockCount(): number {
    return this.daemonData.blockCount ? this.daemonData.blockCount.count : 0;
  }

  //#region Daemon Info 

  private get version(): string {
    return this.daemonData.info ? this.daemonData.info.version : 'Unknown';
  }

  private get blockchainSize(): number {
    return this.daemonData.info ? parseFloat((this.daemonData.info.databaseSize / 1000 / 1000 / 1000).toFixed(2)) : 0;
  }

  private get capacity(): number {
    return this.daemonData.info ? this.daemonData.info.freeSpace + this.daemonData.info.databaseSize : 0;
  }

  private get diskUsage(): number {
    return this.daemonData.info ? parseFloat((this.daemonData.info.databaseSize * 100 / this.capacity).toFixed(2)) : 0;
  }

  private get networkType(): string {
    return this.daemonData.info ? this.daemonData.info.nettype : 'unknown';
  }

  private get connectionStatus(): string {
    return this.daemonData.info ? this.daemonData.info.offline ? 'offline' : 'online' : 'offline';
  }

  private get txCount(): number {
    return this.daemonData.info ? this.daemonData.info.txCount : 0;
  }

  private get poolSize(): number {
    return this.daemonData.info ? this.daemonData.info.txPoolSize : 0;
  }

  private get nodeType(): string {
    return this.daemonData.isBlockchainPruned ? 'pruned' : 'full';
  }

  private get syncProgress(): string {
    const targetHeight = this.targetHeight;
    const height = this.height;
    console.log(`Sync progress, height ${height},targetHeight ${targetHeight}`)

    return `${(height*100/targetHeight).toFixed(2)} %`;
  }

  //#endregion 

  public cards: Card[];

  constructor(
    private daemonService: DaemonService, 
    private navbarService: NavbarService, 
    private daemonData: DaemonDataService, 
    private ngZone: NgZone) {

    this.navbarLinks = [
      new NavbarLink('pills-home-tab', '#pills-home', 'pills-home', false, 'Overview', true),
      new NavbarLink('pills-profile-tab', '#pills-profile', 'pills-profile', false, 'Peers', true),
      new NavbarLink('pills-spans-tab', '#pills-spans', 'pills-spans', false, 'Spans', true)
    ];

    this.cards = this.createCards();

    this.daemonData.syncInfoRefreshEnd.subscribe(() => {
      const $table = $('#table');
      //$table.bootstrapTable({});
      $table.bootstrapTable('refreshOptions', {
        classes: 'table table-bordered table-hover table-dark table-striped'
      });
      if (this.getPeers().length == 0) $table.bootstrapTable('showLoading');
      else 
      {
        $table.bootstrapTable('load', this.getPeers());
        $table.bootstrapTable('hideLoading');
      }

      this.cards = this.createCards();
    })
   }

  ngAfterViewInit(): void {
    console.log('DetailComponent AFTER VIEW INIT');
    this.navbarService.setLinks(this.navbarLinks);
    this.ngZone.run(() => {

      const $table = $('#table');
      $table.bootstrapTable({});
      
      $table.bootstrapTable('refreshOptions', {
        classes: 'table table-bordered table-hover table-dark table-striped'
      });

      $table.bootstrapTable('showLoading');

    });    
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
      new Card('Blockchain size', `${this.blockchainSize} GB`, true),
      new Card('Disk usage', `${this.diskUsage} %`, true),
      new Card('Transaction count', `${this.txCount}`, true),
      new Card('Pool size', `${this.poolSize}`, true)
    ];
  }

  private createCards(): Card[] {
    if (!this.daemonRunning && !this.daemonService.starting) {
      return [];
    }
    if (this.daemonData.initializing || this.daemonService.starting) {
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
      new Card('Blockchain size', `${this.blockchainSize} GB`),
      new Card('Disk usage', `${this.diskUsage} %`),
      new Card('Transaction count', `${this.txCount}`),
      new Card('Pool size', `${this.poolSize}`)
    ];
  }

  public getPeers(): any[] {
    if (!this.daemonData.syncInfo) return [];

    const peers: any[] = [];
    
    this.daemonData.syncInfo.peers.forEach((peer: Peer) => peers.push({
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