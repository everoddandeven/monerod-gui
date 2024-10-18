import { Component, AfterViewInit, NgZone, OnDestroy } from '@angular/core';
import { Peer } from '../../../common/Peer';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { DaemonService, DaemonDataService } from '../../core/services';
import { Subscription } from 'rxjs';
import { Connection, Span } from '../../../common';
import { SimpleBootstrapCard } from '../../shared/utils';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements AfterViewInit, OnDestroy {

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

  public get syncDisabledByWifiPolicy(): boolean {
    return this.daemonData.syncDisabledByWifiPolicy;
  }

  public get syncDisabledByPeriodPolicy(): boolean {
    return this.daemonData.syncDisabledByPeriodPolicy;
  }

  public get syncDisabledFrom(): string {
    return this.daemonService.settings.syncPeriodFrom;
  }

  public get syncDisabledTo(): string {
    return this.daemonService.settings.syncPeriodTo;
  }
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

  public cards: SimpleBootstrapCard[];

  private subscriptions: Subscription[] = [];

  constructor(
    private daemonService: DaemonService, 
    private navbarService: NavbarService, 
    private daemonData: DaemonDataService, 
    private ngZone: NgZone) {

    this.navbarLinks = [
      new NavbarLink('pills-home-tab', '#pills-home', 'pills-home', false, 'Overview', true),
      new NavbarLink('pills-peers-tab', '#pills-peers', 'pills-peers', false, 'Peers', true),
      new NavbarLink('pills-spans-tab', '#pills-spans', 'pills-spans', false, 'Spans', true)
    ];

    this.cards = this.createCards();

    this.subscriptions.push(<Subscription>this.daemonData.syncStart.subscribe((info) => {
      if(!info.first) {
        return;
      }
      
      this.ngZone.run(() => {
        this.cards = this.createCards();
      });

    }));

    this.subscriptions.push(<Subscription>this.daemonData.syncInfoRefreshEnd.subscribe(() => {
      this.refreshTables();

      this.cards = this.createCards();
    }));

   }

  public ngAfterViewInit(): void {
    console.log('DetailComponent AFTER VIEW INIT');
    this.navbarService.setLinks(this.navbarLinks);
    this.ngZone.run(() => {
      this.initTables();
    });    
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }

  private initTable(table: string): void {
    const $table = $(`#${table}Table`);
    $table.bootstrapTable({});
    
    $table.bootstrapTable('refreshOptions', {
      classes: 'table table-bordered table-hover table-dark table-striped'
    });

    $table.bootstrapTable('showLoading');
  }

  private initPeerTable(): void {
    this.initTable('peers');
  }

  private initSpansTable(): void {
    this.initTable('spans');
  }

  private initTables() {
    this.initPeerTable();
    this.initSpansTable();
  }

  private refreshTable(table: string, data: any[]): void {
    const $peersTable = $(`#${table}Table`);
    //$table.bootstrapTable({});
    $peersTable.bootstrapTable('refreshOptions', {
      classes: 'table table-bordered table-hover table-dark table-striped'
    });
    if (this.getPeers().length == 0) $peersTable.bootstrapTable('showLoading');
    else 
    {
      $peersTable.bootstrapTable('load', data);
      $peersTable.bootstrapTable('hideLoading');
    }
  }

  private refreshPeersTable(): void {
    this.refreshTable('peers', this.getPeers());
  }

  private refreshSpansTable(): void {
    this.refreshTable('spans', this.getSpans());
  }

  private refreshTables(): void {
    this.refreshPeersTable();
    this.refreshSpansTable();
  }

  private createCards(): SimpleBootstrapCard[] {
    if (!this.daemonRunning && !this.daemonService.starting) {
      return [];
    }
    const loading = this.daemonData.initializing || this.daemonService.starting;

    const cards: SimpleBootstrapCard[] = [];

    if (this.daemonService.startedAt) {
      cards.push(new SimpleBootstrapCard('Started At', `${this.daemonService.startedAt.toLocaleDateString()} ${this.daemonService.startedAt.toLocaleTimeString()}`));
    }

    cards.push(
      new SimpleBootstrapCard('Connection Status', this.connectionStatus, loading),
      new SimpleBootstrapCard('Network Type', this.networkType, loading),
      new SimpleBootstrapCard('Node Type', this.nodeType, loading),
      new SimpleBootstrapCard('Sync progress', this.syncProgress, loading),
      new SimpleBootstrapCard('Scan Height', `${this.height} / ${this.targetHeight}`, loading),
      new SimpleBootstrapCard('Next needed pruning seed', `${this.nextNeededPruningSeed}`, loading),
      new SimpleBootstrapCard('Block count', `${this.blockCount}`, loading),
      new SimpleBootstrapCard('Monero version', this.version, loading),
      new SimpleBootstrapCard('Blockchain size', `${this.blockchainSize} GB`, loading),
      new SimpleBootstrapCard('Transaction count', `${this.txCount}`, loading),
      new SimpleBootstrapCard('Pool size', `${this.poolSize}`, loading),
      new SimpleBootstrapCard('Disk usage', `${this.diskUsage} %`, loading)
    );

    if (this.daemonData.processStats) {
      cards.push(
        new SimpleBootstrapCard('CPU usage', `${this.daemonData.processStats.cpu.toFixed(2)} %`),
        new SimpleBootstrapCard('Memory usage', `${(this.daemonData.processStats.memory / 1024 / 1024).toFixed(2)} MB`)
      );
    }
    else {
      cards.push(
        new SimpleBootstrapCard('CPU usage', ``, true),
        new SimpleBootstrapCard('Memory usage', ``, true)
      );
    }

    return cards;
  }

  public getPeers(): Connection[] {
    if (!this.daemonData.syncInfo) return [];
    const infos: Connection[] = [];

    this.daemonData.syncInfo.peers.forEach((peer: Peer) => {
      infos.push(peer.info);
    });

    return infos;
  }

  public getSpans(): Span[] {
    if (!this.daemonData.syncInfo) return [];    
    return this.daemonData.syncInfo.spans;
  }

}
