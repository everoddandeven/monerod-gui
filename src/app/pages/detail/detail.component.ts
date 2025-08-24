import { Component, AfterViewInit, NgZone, inject } from '@angular/core';
import { NavbarPill } from '../../shared/components/navbar/navbar.model';
import { DaemonService, DaemonDataService, I2pDaemonService, TorDaemonService } from '../../core/services';
import { Subscription } from 'rxjs';
import { SimpleBootstrapCard } from '../../shared/utils';
import { BasePageComponent } from '../base-page/base-page.component';

@Component({
    selector: 'app-detail',
    templateUrl: './detail.component.html',
    styleUrls: ['./detail.component.scss'],
    standalone: false
})
export class DetailComponent extends BasePageComponent implements AfterViewInit {
  private daemonService = inject(DaemonService);
  private i2pService = inject(I2pDaemonService);
  private torService = inject(TorDaemonService);
  private daemonData = inject(DaemonDataService);
  private ngZone = inject(NgZone);


  private parseAnonInboundUri(anonInbound: string): string {
    const v = anonInbound.split(',');
    const address = v[0];
    const socks = v[1];
    const c = socks.split(':');
    const port = c[1];
    return `${address}:${port}`;
  }

  public get anonymousInbounds(): { uri: string; type: string; icon: string; }[] {
    const res: { uri: string; type: string; icon: string; }[] = [];

    if (this.i2pService.running && this.i2pService.anonymousInbound.length > 0) {
      const uri = this.parseAnonInboundUri(this.i2pService.anonymousInbound);

      res.push({ 
        uri,
        type: 'P2P',
        icon: 'bi bi-hurricane m-2'
       });
    }

    if (this.torService.running && this.torService.anonymousInbound.length > 0) {
      const uri = this.parseAnonInboundUri(this.torService.anonymousInbound);

      res.push({ 
        uri,
        type: 'P2P',
        icon: 'bi bi-bullseye m-2'
       });
    }

    return res;
  }

  public get anonymousServices(): { uri: string; type: string; }[] {
    const res: { uri: string; type: string; }[] = [];
    const servers = this.i2pService.tunnelsData.servers;

    if (this.i2pService.running && servers.length > 0) {
      for (const server of servers) {
        if (server.name === 'monero-rpc') {
          res.push({ uri: `${server.address}`, type: 'RPC' });
        }
        else if (server.name === 'monero-node') {
          res.push({ uri: `${server.address}`, type: 'P2P' });
        }
      }
    }

    return res;
  }

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

    let elapsedMilliseconds = now.getTime() - startedAt.getTime();

    if (elapsedMilliseconds < 0) {
      console.warn("Elapsed time is negative");
      this.daemonService.startedAt = now;
      elapsedMilliseconds = 0;
    }

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
    return this.daemonService.stopping || this.daemonService.quitting;
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

  private get startHeight(): number {
    return this.daemonService.startHeight;
  }

  //#endregion

  //#region Daemon Info 

  private get version(): string {
    return this.daemonData.info ? this.daemonData.info.version : 'Unknown';
  }

  private get networkType(): string {
    return this.daemonData.info ? this.daemonData.info.nettype : 'unknown';
  }

  private get connectionStatus(): string {
    return this.daemonData.info ? this.daemonData.info.offline ? 'offline' : 'online' : 'offline';
  }

  private get connectionType(): string {
    const usingProxy = this.daemonService.settings.proxy !== '';

    if (this.i2pService.settings.enabled && this.torService.settings.enabled) {
      if (this.i2pService.settings.torAsOutproxy && this.torService.settings.proxyAllNetConnections) {
        return 'I2P/TOR (full)';
      }

      return usingProxy ? 'I2P/TOR (proxy)' : 'I2P/TOR (partial)';
    }
    else if (this.i2pService.settings.enabled) {
      if (this.i2pService.settings.outproxy !== undefined) return 'I2P (full)';

      const usingSocksProxy = usingProxy && this.daemonService.settings.proxy === this.i2pService.proxy;

      return usingSocksProxy ? 'I2P (full)' : usingProxy ? 'I2P (proxy)' : 'I2P (partial)';
    }
    else if (this.torService.settings.enabled) {
      if (this.torService.settings.proxyAllNetConnections) return 'TOR (full)';

      return usingProxy ? 'TOR (proxy)' : 'TOR (partial)';
    }

    return usingProxy ? 'proxy' : 'clearnet';
  }


  private get nodeType(): string {
    return this.daemonData.isBlockchainPruned ? 'pruned' : 'full';
  }

  private get syncProgress(): string {
    const startHeight = this.startHeight;
    const targetHeight = this.targetHeight;
    const height = this.height;
    const blocksLeft = targetHeight - startHeight;
    const blocksDone = targetHeight - height;
    const value = 100 - (blocksDone*100/blocksLeft);
    const progress = `${value.toFixed(2)} %`;
    
    if (height == targetHeight) {
      return "100 %"
    }

    return progress;
  }



  //#endregion 

  public cards: SimpleBootstrapCard[];

  constructor() {    
    super();

    this.setLinks([
      new NavbarPill('home', 'Overview', false, true)
    ]);

    this.cards = this.createCards();
  }

  private registerEventListeners(): void {
    const syncStartSub: Subscription = this.daemonData.syncStart.subscribe((info) => {
      if(!info.first) {
        return;
      }
      
      this.ngZone.run(() => {
        this.cards = this.createCards();
      });
    });

    const daemonStatusSub: Subscription = this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      if (!running) {
        this.destroyTables();
      }
    });

    const syncInfoRefreshEndSub: Subscription = this.daemonData.syncInfoRefreshEnd.subscribe(() => {
      this.cards = this.createCards();
    });

    this.subscriptions.push(syncStartSub, syncInfoRefreshEndSub, daemonStatusSub);
  }

  public ngAfterViewInit(): void {
    this.ngZone.run(() => {
      this.registerEventListeners();
    });
  }

  private createCards(): SimpleBootstrapCard[] {
    if (!this.daemonRunning && !this.daemonService.starting) {
      return [];
    }
    const loading = this.daemonData.initializing || this.daemonService.starting || this.daemonData.info === undefined || this.daemonData.syncInfo === undefined;

    const cards: SimpleBootstrapCard[] = [];

    cards.push(
      new SimpleBootstrapCard('Connection Status', this.connectionStatus, loading),
      new SimpleBootstrapCard('Connection Type', this.connectionType, loading),
      new SimpleBootstrapCard('Network Type', this.networkType, loading),
      new SimpleBootstrapCard('Node Type', this.nodeType, loading),
      new SimpleBootstrapCard('Sync progress', this.syncProgress, loading),
      new SimpleBootstrapCard('Scan Height', `${this.height} / ${this.targetHeight}`, loading),
      new SimpleBootstrapCard('Monero version', this.version, loading),
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

  



}
