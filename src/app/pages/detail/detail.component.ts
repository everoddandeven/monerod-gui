import { Component, AfterViewInit, NgZone } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { DaemonService, DaemonDataService } from '../../core/services';
import { Subscription } from 'rxjs';
import { Connection, Span, Peer } from '../../../common';
import { SimpleBootstrapCard } from '../../shared/utils';
import { BasePageComponent } from '../base-page/base-page.component';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent extends BasePageComponent implements AfterViewInit {

  public get uptime(): { seconds: string, minutes: string, hours: string } {
    const startedAt = this.daemonService.startedAt;

    if (!startedAt) {
      return {
        seconds: '00',
        minutes: '00',
        hours: '00'
      };
    }

    const now = new Date();
    const elapsedMilliseconds = now.getTime() - startedAt.getTime();

    const seconds = Math.floor((elapsedMilliseconds / 1000) % 60);
    const minutes = Math.floor((elapsedMilliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(elapsedMilliseconds / (1000 * 60 * 60));

    return {
      hours: hours < 10 ? `0${hours}` : `${hours}`,
      minutes: minutes < 10 ? `0${minutes}` : `${minutes}`,
      seconds: seconds < 10 ? `0${seconds}` : `${seconds}`
    }
  }

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get startingDaemon(): boolean {
    return this.daemonData.starting;
  }

  public get stoppingDaemon(): boolean {
    return this.daemonData.stopping;
  }

  public get syncDisabledByWifiPolicy(): boolean {
    return this.daemonData.syncDisabledByWifiPolicy;
  }

  public get syncDisabledByPeriodPolicy(): boolean {
    return this.daemonData.syncDisabledByPeriodPolicy;
  }

  public get syncDisabled(): boolean {
    return this.daemonService.settings.noSync;
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
    
    const progress = `${(height*100/targetHeight).toFixed(2)} %`;

    if (height < targetHeight && progress == '100 %') {
      return '99.99 %';
    }

    return progress;
  }

  private get wasBootstrapEverUsed(): boolean {
    return this.daemonData.info ? this.daemonData.info.wasBoostrapEverUsed : false;
  }

  private get _bootstrapDaemonAddress(): string {
    return this.daemonData.info && this.daemonData.info.bootstrapDaemonAddress != '' ? this.daemonData.info.bootstrapDaemonAddress : 'Not set';
  }

  private get heightWithoutBootstrap(): number {
    return this.daemonData.info ? this.daemonData.info.heightWithoutBootstrap : 0;
  }

  //#endregion 

  //#region Bootstrap Daemon 

  public boostrapCards: SimpleBootstrapCard[] = [];
  public settingBootstrapDaemon: boolean = false;
  public bootstrapDaemonAddress: string = '';
  public bootstrapDaemonUsername: string = '';
  public bootstrapDaemonPassword: string = '';
  public bootstrapDaemonProxy: string = '';
  public setBootstrapDaemonSuccess: boolean = false;
  public setBootstrapDaemonError: string = '';

  public get canSetBootstrapDaemon(): boolean {
    if (this.settingBootstrapDaemon) {
      return false;
    }

    return this.bootstrapDaemonAddress != '';
  }

  //#endregion

  public cards: SimpleBootstrapCard[];

  constructor(
    private daemonService: DaemonService, 
    navbarService: NavbarService, 
    private daemonData: DaemonDataService, 
    private ngZone: NgZone) {
    
    super(navbarService);

    this.setLinks([
      new NavbarLink('pills-home-tab', '#pills-home', 'pills-home', false, 'Overview', true),
      new NavbarLink('pills-peers-tab', '#pills-peers', 'pills-peers', false, 'Peers', true),
      new NavbarLink('pills-spans-tab', '#pills-spans', 'pills-spans', false, 'Spans', true),
      new NavbarLink('pills-bootstrap-tab', '#pills-bootstrap', 'pills-bootstrap', false, 'Bootstrap')
    ]);

    this.cards = this.createCards();
    this.boostrapCards = this.createBootstrapCards();
  }

  private registerEventListeners(): void {
    const syncStartSub: Subscription = this.daemonData.syncStart.subscribe((info) => {
      if(!info.first) {
        return;
      }
      
      this.ngZone.run(() => {
        this.cards = this.createCards();
        this.boostrapCards = this.createBootstrapCards();
        this.loadTables(true);
      });
    });

    const daemonStatusSub = this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      if (!running) {
        this.destroyTables();
      }
    });

    const syncInfoRefreshEndSub: Subscription = this.daemonData.syncInfoRefreshEnd.subscribe(() => {
      this.cards = this.createCards();
      this.boostrapCards = this.createBootstrapCards();
      this.loadTables();
    });

    this.subscriptions.push(syncStartSub, syncInfoRefreshEndSub, daemonStatusSub);
  }

  public ngAfterViewInit(): void {
    this.ngZone.run(() => {
      this.registerEventListeners();
      this.loadTables();
    });
  }

  private loadPeersTable(loading: boolean = false): void {
    this.loadTable('peersTable', this.getPeers(), loading);
  }

  private loadSpansTable(loading: boolean = false): void {
    this.loadTable('spansTable', this.getSpans(), loading);
  }

  private loadTables(loading: boolean = false): void {
    this.loadPeersTable(loading);
    this.loadSpansTable(loading);
  }

  private createCards(): SimpleBootstrapCard[] {
    if (!this.daemonRunning && !this.daemonService.starting) {
      return [];
    }
    const loading = this.daemonData.initializing || this.daemonService.starting || this.daemonData.info === undefined || this.daemonData.syncInfo === undefined;

    const cards: SimpleBootstrapCard[] = [];

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

  private createBootstrapCards(): SimpleBootstrapCard[] {
    if (!this.daemonRunning && !this.daemonService.starting) {
      return [];
    }
    const loading = this.daemonData.initializing || this.daemonService.starting || this.daemonData.info === undefined || this.daemonData.syncInfo === undefined;

    const cards: SimpleBootstrapCard[] = [];

    cards.push(
      new SimpleBootstrapCard('Was Bootstrap Ever Used', `${this.wasBootstrapEverUsed}`, loading),
      new SimpleBootstrapCard('Boostrap Daemon Address', this._bootstrapDaemonAddress, loading),
      new SimpleBootstrapCard('Height Without Bootstrap', `${this.heightWithoutBootstrap}`, loading)
    );

    return cards;
  }

  private getPeers(): Connection[] {
    if (!this.daemonData.syncInfo) return [];
    const infos: Connection[] = [];

    this.daemonData.syncInfo.peers.forEach((peer: Peer) => {
      infos.push(peer.info);
    });

    return infos;
  }

  private getSpans(): Span[] {
    if (!this.daemonData.syncInfo) return [];    
    return this.daemonData.syncInfo.spans;
  }

  public async setBootstrapDaemon(): Promise<void> {
    this.settingBootstrapDaemon = true;

    try {
      await this.daemonService.setBootstrapDaemon(this.bootstrapDaemonAddress, this.bootstrapDaemonUsername, this.bootstrapDaemonPassword, this.bootstrapDaemonProxy);
      this.setBootstrapDaemonError = '';
      this.setBootstrapDaemonSuccess = true;
    }
    catch(error: any) {
      this.setBootstrapDaemonSuccess = false;
      this.setBootstrapDaemonError = `${error}`;
    }

    this.settingBootstrapDaemon = false;
  }

}
