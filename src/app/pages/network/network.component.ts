import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { DaemonDataService, DaemonService, I2pDaemonService, TorBootstrapPhase, TorDaemonService } from '../../core/services';
import { NavbarPill } from '../../shared/components/navbar/navbar.model';
import { Chart, ChartData } from 'chart.js/auto'
import { Ban, Connection, HardForkInfo, LocalDestinationsData, MainData, NetStats, NetStatsHistoryEntry, Peer, PeerInfo, ProcessStats, PublicNode, Span, TunnelsData } from '../../../common';
import { Subscription } from 'rxjs';
import { BasePageComponent } from '../base-page/base-page.component';
import { LogsService } from '../logs/logs.service';
import { P2poolService } from '../../core/services/p2pool/p2pool.service';

type OverviewTab = 'overview' | 'connections' | 'hardfork';
type ToolsTab = 'limitBandwidth' | 'limitPeers' | 'setBans';
type PeersTab = 'p2p' | 'rpc' | 'inPeers' | 'outPeers' | 'bans';
type P2PoolTab = 'dashboard' | 'logs';
type AnonNetTab = 'dashboard' | 'logs' | 'commands' | 'localDestinations' | 'tunnels';

@Component({
    selector: 'app-network',
    templateUrl: './network.component.html',
    styleUrl: './network.component.scss',
    standalone: false
})
export class NetworkComponent extends BasePageComponent implements AfterViewInit, OnDestroy {
  private readonly daemonService = inject(DaemonService);
  private readonly daemonData = inject(DaemonDataService);
  private readonly i2pService = inject(I2pDaemonService);
  private readonly torService = inject(TorDaemonService);
  private readonly logsService = inject(LogsService);
  private readonly p2poolService = inject(P2poolService);

  private connections?: Connection[];
  private netStatsBytesInChart?: Chart;
  private netStatsBytesOutChart?: Chart;

  public limiting: boolean = false;
  public limitUp: number = 0;
  public limitDown: number = 0;
  public setLimitResult?: { limitUp: number, limitDown: number };
  public setLimitSuccess: boolean = false;
  public setLimitError: string = '';

  public lastNetStats: NetStats;
  public currentNetStats: NetStats;
  public getConnectionsError: string = '';
  public refreshingConnectionsTable: boolean = false;

  public limitPeersError: string = '';
  public limitPeersSuccess: boolean = false;
  public limitPeersResult: string = '';
  public limitInPeers: number = 0;
  public limitOutPeers: number = 0;
  public limitingPeers: boolean = false;

  public currentOverviewTab: OverviewTab = 'overview';
  public currentToolsTab: ToolsTab = 'limitBandwidth';
  public currentPeersTab: PeersTab = 'p2p';
  public currentTorTab: AnonNetTab = 'dashboard';
  public currentI2pTab: AnonNetTab = 'dashboard';
  public currentP2PoolTab: P2PoolTab = 'dashboard';

  public refreshingPeerList: boolean = false;
  public refreshingPublicNodes: boolean = false;

  public getPeerListError: string = '';
  public getPublicNodesError: string = '';

  public refreshingBansTable: boolean = false;
  public settingBans: boolean = false;
  public setBansBansJsonString: string = '';
  public setBansSuccess: boolean = false;
  public setBansError: string = '';
  public hardForkInfo?: HardForkInfo;

  private peerList?: PeerInfo[];
  private publicNodes?: PublicNode[];

  // #region Anon Networks

  private initingLogs: boolean = false;
  private scrollEventsRegistered: boolean = false;
  public scrolling: boolean = false;

  private readonly scrollHandler: (ev: Event) => void = (ev: Event) => {
    this.scrolling = ev.type === 'scroll';
  };

  // #region Tor

  private _torProcessStats: ProcessStats = {
    cpu: 0,
    memory: 0,
    ppid: 0,
    pid: 0,
    ctime: 0,
    elapsed: 0,
    timestamp: 0
  };
  public _torUptime: number = 0;
  public torNetworkStatus: any = '';

  public torCircuitEstablished: boolean = false;
  public torBootstrapPhase: TorBootstrapPhase = new TorBootstrapPhase('NOTICE');

  public torSent: number = 0;
  public torReceived: number = 0;

  private refreshingTor: boolean = false;
  private refreshInterval?: NodeJS.Timeout;
  private readonly refreshHandler: () => void = () => this.refreshAnonNetworksInfo();

  // #endregion

  // #region I2p

  private _i2pProcessStats: ProcessStats = {
    cpu: 0,
    memory: 0,
    ppid: 0,
    pid: 0,
    ctime: 0,
    elapsed: 0,
    timestamp: 0
  };

  private refreshing: boolean = false;

  public mainData: MainData = new MainData();
  public localDestinations: LocalDestinationsData = new LocalDestinationsData();
  public i2pTunnels: TunnelsData = new TunnelsData();

  public loggingLevel: 'none' | 'critical' | 'error' | 'warn' | 'info' | 'debug' = 'warn';


  // #endregion

  // #region Getters

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonData.stopping;
  }

  public get networkStatus(): string {
    const info = this.daemonData.info;
    if (!info) {
      if (this.daemonData.running) return "Loading ...";
      return "off";
    }

    return info.status;
  }

  public get totalDownloadGB(): string {
    return `${this.currentNetStats.totalGigaBytesIn.toFixed(2)} GB`;
  }

  public get totalUploadGB(): string {
    return `${this.currentNetStats.totalGigaBytesOut.toFixed(2)} GB`;
  }

  public get totalPacketsIn(): string {
    return `${this.currentNetStats.totalPacketsIn}`;
  }

  public get inOutPeers(): string {
    const info = this.daemonData.info;
    if (!info) return "0 / 0";
    return `${info.incomingConnectionsCount} / ${info.outgoingConnectionsCount}`;
  }

  public get totalConnections(): number {
    const info = this.daemonData.info;
    if (!info) return 0;

    return info.incomingConnectionsCount + info.outgoingConnectionsCount;
  }

  public get rpcConnections(): number {
    const info = this.daemonData.info;
    if (!info) return 0;

    return info.rpcConnectionsCount;
  }

  public get p2pHost(): string {
    const conf = this.daemonService.settings;
    const port = conf.getPort();
    const ip = conf.p2pBindIp;
    return `http://${ip}:${port}`;
  }

  public get rpcHost(): string {
    const conf = this.daemonService.settings;
    const port = conf.getRpcPort();
    const ip = conf.rpcBindIp;
    return `http://${ip}:${port}`;
  }

  public get zmqHost(): string {
    const conf = this.daemonService.settings;
    if (conf.noZmq) return 'disabled';
    const port = conf.getZmqPort();
    const ip = conf.zmqRpcBindIp;
    return `http://${ip}:${port}`;
  }

  public get zmqPub(): string {
    const conf = this.daemonService.settings;
    if (conf.noZmq) return 'disabled';
    const zmqPub = conf.getZmqPub();
    if (zmqPub === '') return 'not set';
    return zmqPub;
  }

  // #region Tor

  public get torP2pHost(): string {
    const tor = this.torService;
    const enabled = tor.settings.enabled;
    if (!enabled) return "disabled";
    if (tor.starting) return "Loading ...";
    if (!tor.running) return "unreachable";
    if (tor.anonymousInbound === '') return "unknown";
    return tor.anonymousInbound;
  }

  public get torRpcHost(): string {
    const tor = this.torService;
    const enabled = tor.settings.enabled;
    if (!enabled) return "disabled";
    if (tor.starting) return "Loading ...";
    if (!tor.running) return "unreachable";
    if (tor.anonymousInbound === '') return "unknown";
    return tor.anonymousInbound;
  }

  public get torTxProxyEnabled(): string {
    const tor = this.torService;
    const enabled = tor.settings.enabled;
    if (!enabled) return "disabled";
    if (tor.starting) return "Loading ...";
    if (!tor.running) return "unreachable";
    if (tor.txProxy) return "enabled";
    return "disabled";
  }

  public get torRunning(): boolean {
    return this.torService.running;
  }
  
  public get torStarting(): boolean {
    return this.torService.starting;
  }

  public get torStopping(): boolean {
    return this.torService.stopping || this.daemonService.stopping;
  }

  public get torEnabled(): boolean {
    return this.torService.settings.enabled;
  }

  public get changingTorIdentity(): boolean {
    return this.torService.changingIdentity;
  }

  public get torLines(): string [] {
    return this.logsService.logs.tor;
  }

  public get torLogs(): string {
    return this.initingLogs ? '' : this.torLines.join("\n");
  }

  // #endregion

  // #region I2p

  public get i2pP2pHost(): string {
    const i2p = this.i2pService;
    const enabled = i2p.settings.enabled;
    if (!enabled) return "disabled";
    if (i2p.starting) return "Loading ...";
    if (!i2p.running) return "unreachable";
    if (i2p.anonymousInbound === '') return "unknown";
    return i2p.anonymousInbound;
  }

  public get i2pRpcHost(): string {
    const i2p = this.i2pService;
    const enabled = i2p.settings.enabled;
    if (!enabled) return "disabled";
    if (i2p.starting) return "Loading ...";
    if (!i2p.running) return "unreachable";
    if (i2p.anonymousInbound === '') return "unknown";
    return i2p.anonymousInbound;
  }

  public get i2pTxProxyEnabled(): string {
    const i2p = this.i2pService;
    const enabled = i2p.settings.enabled;
    if (!enabled) return "disabled";
    if (i2p.starting) return "Loading ...";
    if (!i2p.running) return "unreachable";
    if (i2p.txProxy) return "enabled";
    return "disabled";
  }

  public get i2pStopping(): boolean {
    return this.i2pService.stopping || this.daemonService.stopping;
  }

  public get i2pStarting(): boolean {
    return this.i2pService.starting;
  }

  public get i2pRunning(): boolean {
    return this.i2pService.running;
  }

  public get i2pEnabled(): boolean {
    return this.i2pService.settings.enabled;
  }

  public get i2pdLines(): string [] {
    return this.logsService.logs.i2pd;
  }

  public get i2pdLogs(): string {
    return this.initingLogs ? '' : this.i2pdLines.join("\n");
  }

  // #endregion

  // #region P2Pool

  public get p2poolLines(): string [] {
    return this.logsService.logs.p2pool;
  }

  public get p2poolLogs(): string {
    return this.initingLogs ? '' : this.p2poolLines.join("\n");
  }

  public get p2poolStopping(): boolean {
    return this.p2poolService.stopping || this.daemonService.stopping;
  }

  public get p2poolStarting(): boolean {
    return this.p2poolService.starting;
  }

  public get p2pRunning(): boolean {
    return this.p2poolService.running;
  }

  public get p2poolEnabled(): boolean {
    return this.p2poolService.settings.path !== '';
  }

  // #endregion

  public get txPadding(): string {
    const enabled = this.daemonService.settings.padTransactions;
    return enabled ? 'enabled' : 'disabled';
  }

  public get connectionType(): string {
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

  public get torStatus(): string {
    const tor = this.torService;
    const enabled = tor.settings.enabled;
    const installed = tor.settings.path !== '';
    if (!installed) return "not configured";
    if (tor.starting) return "starting";
    if (tor.stopping) return "stopping";
    if (tor.running) return "running";
    if (!enabled) return "disabled";

    return "not running";
  }

  public get i2pStatus(): string {
    const i2p = this.i2pService;
    const enabled = i2p.settings.enabled;
    const installed = i2p.settings.path !== '';
    if (!installed) return "not configured";
    if (i2p.starting) return "starting";
    if (i2p.stopping) return "stopping";
    if (i2p.running) return "running";
    if (!enabled) return "disabled";

    return "not running";
  }

  public get currentProxy(): string {
    if (this.i2pService.settings.enabled) return "I2P";
    else if (this.torService.settings.enabled) return "TOR";
    const proxy = this.daemonService.settings.proxy;
    if (proxy === '') return "None";
    return proxy;
  }

  public get uploadLimit(): string {
    const l = this.daemonService.limits.bandwidth.out;
    if (l === -1) return `8192 kB/s`;
    return `${l} kB/s`;
  }

  public get downloadLimit(): string {
    const l = this.daemonService.limits.bandwidth.in;
    if (l === -1) return `32768 kB/s`;
    return `${l} kB/s`;
  }

  public get inPeersLimit(): number {
    const l = this.daemonService.limits.peers.in;
    if (l === -1) return 12;
    return l;
  }

  public get outPeersLimit(): number {
    const l = this.daemonService.limits.peers.out;
    if (l === -1) return 12;
    return l;
  }

  public get maxConnectionsPerIp(): number {
    return this.daemonService.settings.maxConnectionsPerIp;
  }

  public get whitePeers(): number {
    const info = this.daemonData.info;
    if (!info) return 0;
    return info.whitePeerlistSize;
  }

  public get greyPeers(): number {
    const info = this.daemonData.info;
    if (!info) return 0;
    return info.greyPeerlistSize;
  }

  public get validBans(): boolean {
    try {
      const bans: any[] = JSON.parse(this.setBansBansJsonString);

      if (!Array.isArray(bans)) {
        return false;
      }

      bans.forEach((ban) => Ban.parse(ban));

      return true;
    }
    catch(error: any) {
      console.error(error);
      return false;
    }
  }

  private get bans(): Ban[] {
    if (!this.validBans) {
      return [];
    }
    const bans: Ban[] = [];
    const rawBans: any[] = [];

    rawBans.forEach((rawBan) => bans.push(Ban.parse(rawBan)));

    return bans;
  }

  public get i2pCpu(): string {
    return `${this._i2pProcessStats.cpu.toFixed(2)}%`;
  }

  public get i2pRam(): string {
    return `${(this._i2pProcessStats.memory / 1024 / 1024).toFixed(2)} MB`;
  }

  public get i2pPid(): number {
    return this._i2pProcessStats.pid;
  }

  public get torProcessStats(): ProcessStats {
    return this._torProcessStats;
  }

  public get torCpu(): string {
    return `${this.torProcessStats.cpu.toFixed(2)}%`;
  }

  public get torRam(): string {
    return `${(this.torProcessStats.memory / 1024 / 1024).toFixed(2)} MB`;
  }

  public get torPid(): number {
    return this.torProcessStats.pid;
  }

  public get torUptime(): string {
    const elapsedMilliseconds = this._torUptime * 1000;

    const seconds = Math.floor((elapsedMilliseconds / 1000) % 60);
    const minutes = Math.floor((elapsedMilliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(elapsedMilliseconds / (1000 * 60 * 60));
    
    const uptime = {
      hours: hours < 10 ? `0${hours}` : `${hours}`,
      minutes: minutes < 10 ? `0${minutes}` : `${minutes}`,
      seconds: seconds < 10 ? `0${seconds}` : `${seconds}`
    };

    return `${uptime.hours}:${uptime.minutes}:${uptime.seconds}`;
  }

  public get torCircuit(): string {
    if (this.torCircuitEstablished) return "established";
    return "none";
  }

  public get torBootstrap(): string {
    if (!this.torService.settings.enabled) return "";
    const progress = this.torBootstrapPhase.progress;
    if (typeof progress !== 'number') return "0 %";
    return `${progress.toFixed(2)} %`;
  }

  public get hardForkStatus(): string {
    const info = this.hardForkInfo;
    if (!info) return "";
    if (info.enabled) return "enabled";
    return "disabled";
  }

  public get hardForkEarliestHeight(): string {
    const info = this.hardForkInfo;
    if (!info) return "unknown";
    return `${info.earliestHeight}`;
  }

  public get hardForkBlockVersion(): string {
    const info = this.hardForkInfo;
    if (!info) return "unknown";
    return `${info.version}`;
  }

  public get hardForkVoting(): number {
    return this.hardForkInfo ? this.hardForkInfo.voting : 0;
  }

  public get hardForkVotes(): number {
    return this.hardForkInfo ? this.hardForkInfo.votes : 0;
  }

  public get hardForkWindow(): number {
    return this.hardForkInfo ? this.hardForkInfo.window : 0;
  }

  public get hardForkThreshold(): number {
    return this.hardForkInfo ? this.hardForkInfo.threshold : 0;
  }

  public get hardForkState(): string {
    const info = this.hardForkInfo;
    if (!info) return 'unknown';
    const state = info.state;

    if (state == 0) {
      return 'There is likely a hard fork';
    }
    else if (state == 1) {
      return 'An update is needed to fork properly';
    }

    return '';
  }

  // #endregion

  constructor() {
    super();
    this.setLinks([
      new NavbarPill('net-overview', 'Overview'),
      new NavbarPill('net-peers', 'Peers'),
      new NavbarPill('net-stats', 'Statistics'),
      new NavbarPill('net-p2pool', 'P2Pool'),
      new NavbarPill('net-tor', 'Tor'),
      new NavbarPill('net-i2p', 'I2P'),
      new NavbarPill('net-tools', 'Tools')
    ]);

    const lastNetStats = this.daemonData.netStatsHistory.last;
    this.currentNetStats = lastNetStats ? lastNetStats.netStats : new NetStats(0, 0, 0, 0);
    this.lastNetStats = this.currentNetStats.clone();

    const netStatsRefreshStartSub: Subscription = this.daemonData.netStatsRefreshEnd.subscribe(() => {
      this.refreshNetStatsHistory();
      if (!this.hardForkInfo) this.refreshHardForkInfo().then().catch((err: any) => console.error(err));
    });

    const daemonStatusSub: Subscription = this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      if (!running) {
        if (this.netStatsBytesInChart) {
          this.netStatsBytesInChart.destroy();
          this.netStatsBytesInChart = undefined;
        }
        if (this.netStatsBytesOutChart) {
          this.netStatsBytesOutChart.destroy();
          this.netStatsBytesOutChart = undefined;
        }

        this.destroyTables();
      }
      else {
        this.initNetStatsHistoryChart();
        this.loadConnectionsTable();
        this.refreshHardForkInfo().then().catch((err: any) => console.error(err));
      }
    });

    if (this.torService.running) this.startLoop();

    const onStart = this.torService.onStart.subscribe(() => {
      if (this.refreshInterval === undefined) this.startLoop();
    });

    const onStop = this.torService.onStop.subscribe(() => {
      if (this.refreshInterval !== undefined) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = undefined;
      }
    });

    const onLogSub: Subscription = this.logsService.onLog.subscribe(({ type } : { message: string; type: 'monerod' | 'i2pd'; }) => {
      this.onLog(type);
    });

    this.subscriptions.push(netStatsRefreshStartSub, daemonStatusSub, onStart, onStop, onLogSub);
  }

  private async refreshHardForkInfo(): Promise<void> {
    this.hardForkInfo = await this.daemonService.hardForkInfo();
  }

  private initLogs(): void {
    this.initingLogs = true;  
    setTimeout(() => {
      this.registerScrollEvents();
      this.scrollTablesContentToBottom();
      this.initingLogs = false;
      
      setTimeout(() => {
        this.scrollTablesContentToBottom();
      }, 500);
    }, 500);  
  }

  public scrollTablesContentToBottom(): void {
    this.scrollTableContentToBottom('pills-tabContent');
  }

  public ngAfterViewInit(): void {
    this.initNetStatsHistoryChart();
    this.refreshConnectionsTable().then().catch((error: any) => console.error(error));
    this.initTable('bansTable', true);
    this.loadTables();
    this.refreshTor().catch((error: any) => console.error(error));
  }

  private loadTables(): void {
    this.loadPeerListTable();
    this.loadPublicNodesTable();
    this.loadConnectionsTable();
    this.loadPeersTable();
    this.loadSpansTable();
    this.refreshBansTable().then().catch((err: any) => console.error(err));
    this.refreshPublicNodesTable().then().catch((err: any) => console.error(err));
    this.refreshPeerListTable().then().catch((err: any) => console.error(err));
  }

  public async refreshConnectionsTable(): Promise<void> {
    if (!await this.daemonService.isRunning()) {
      return;
    }
    
    this.refreshingConnectionsTable = true;

    try {
      this.connections = await this.daemonService.getConnections();
    }
    catch(error: any) {
      console.error(error);
      this.connections = undefined;
    }

    this.loadConnectionsTable();
    this.refreshingConnectionsTable = false;
  }

  private loadConnectionsTable(): void {
    this.loadTable('connectionsTable', this.connections ? this.connections : [], this.connections === undefined && this.getConnectionsError == '');
  }

  private buildChartBytesInData(): ChartData {
    const labels: string [] = [];
    const data: number[] = [];
    this.daemonData.netStatsHistory.history.forEach((entry: NetStatsHistoryEntry) => {
      labels.push(`${entry.date.toLocaleTimeString()} ${entry.date.toLocaleDateString()}`);
      data.push(entry.netStats.totalGigaBytesIn);
    });

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'transparent',
        borderColor: '#ff5733',
        borderWidth: 4,
        pointBackgroundColor: '#ff5733',
        radius: 0
      }]
    };
  }

  private buildChartBytesOutData(): ChartData {
    const labels: string [] = [];
    const data: number[] = [];
    this.daemonData.netStatsHistory.history.forEach((entry: NetStatsHistoryEntry) => {
      labels.push(`${entry.date.toLocaleTimeString()} ${entry.date.toLocaleDateString()}`);
      data.push(entry.netStats.totalGigaBytesOut);
    });

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'transparent',
        borderColor: '#ff5733',
        borderWidth: 4,
        pointBackgroundColor: '#ff5733',
        radius: 0
      }]
    };
  }

  private initNetStatsHistoryChart(): void {
    const ctx1 = <HTMLCanvasElement>document.getElementById('netStatsBytesInChart');
    const ctx2 = <HTMLCanvasElement>document.getElementById('netStatsBytesOutChart');

    if (!ctx1 || !ctx2) {
      return;
    }

    this.netStatsBytesInChart = new Chart(ctx1, {
      type: 'line',
      data: this.buildChartBytesInData(),
      options: {
        animation: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            boxPadding: 3
          },
          decimation: {
            enabled: true,
            algorithm: 'min-max'
          }
        }
      }
    });

    this.netStatsBytesOutChart = new Chart(ctx2, {
      type: 'line',
      data: this.buildChartBytesOutData(),
      options: {
        animation: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            boxPadding: 3
          },
          decimation: {
            enabled: true,
            algorithm: 'min-max'
          }
        }
      }
    });

    this.netStatsBytesInChart.update();
    this.netStatsBytesOutChart.update();
  }

  private refreshNetStatsHistory(): void {
    const last = this.daemonData.netStatsHistory.last;

    if (!this.netStatsBytesInChart || !this.netStatsBytesOutChart) {
      this.initNetStatsHistoryChart();
    }
    else if (last) {
      const label = `${last.date.toLocaleDateString()} ${last.date.toLocaleTimeString()}`;
      
      this.netStatsBytesInChart.data.labels?.push(label);
      this.netStatsBytesInChart.data.datasets.forEach((dataset) => {
        dataset.data.push(last.netStats.totalGigaBytesIn);
      });

      this.netStatsBytesOutChart.data.labels?.push(label);
      this.netStatsBytesOutChart.data.datasets.forEach((dataset) => {
        dataset.data.push(last.netStats.totalGigaBytesOut);
      });

      this.netStatsBytesInChart.update();
      this.netStatsBytesOutChart.update();
      this.currentNetStats = last.netStats;
    }
  }

  private loadPeerListTable(): void {
    const loading = this.peerList === undefined;

    this.loadTable('peerListTable', this.peerList ? this.peerList : [], loading);
  }

  private loadPublicNodesTable(): void {
    this.loadTable('publicNodesTable', this.publicNodes ? this.publicNodes : [], this.publicNodes === undefined);
  }

  public async refreshPeerListTable(): Promise<void> {
    if (!await this.daemonService.isRunning()) {
      return;
    }

    this.refreshingPeerList = true;
    
    try {
      this.peerList = await this.daemonService.getPeerList();
    }
    catch(error: any) {
      console.error(error);
      this.getPeerListError = `${error}`;
      this.peerList = undefined;
    }

    this.loadPeerListTable();
    this.refreshingPeerList = false;
  }

  public async refreshPublicNodesTable(): Promise<void> {
    if (!await this.daemonService.isRunning()) {
      return;
    }
    
    this.refreshingPublicNodes = true;
    
    try {
      this.publicNodes = await this.daemonService.getPublicNodes();
    }
    catch(error: any) {
      console.error(error);
      this.publicNodes = undefined;
      this.getPublicNodesError = `${error}`;
    }

    this.loadPublicNodesTable();
    this.refreshingPublicNodes = false;
  }

  public async limitPeers(): Promise<void> {
    this.limitingPeers = true;

    try {
      await this.daemonService.inPeers(this.limitInPeers);
      await this.daemonService.outPeers(this.limitOutPeers);
      this.limitPeersError = '';
      this.limitPeersSuccess = true;
    } catch(error: any) {
      console.error(error);
      this.limitPeersSuccess = false;
      this.limitPeersError = `${error}`;
    }

    this.limitingPeers = false;
  }

  public async setLimit(): Promise<void> {
    this.limiting = true;

    try {
      this.setLimitResult = await this.daemonService.setLimit(this.limitUp, this.limitDown);
      this.setLimitSuccess = true;
      this.setLimitError = '';
    } 
    catch (error: any) {
      console.error(error);
      this.setLimitResult = undefined;
      this.setLimitSuccess = false;
      this.setLimitError = `${error}`;
    }

    this.limiting = false;
  }

  public async refreshBansTable(): Promise<void> {
    let bans: Ban[] = [];
    this.refreshingBansTable = true;
    try {
      const running = await this.daemonService.isRunning();

      if (running) {
        bans = await this.daemonService.getBans();
      }
      else {
        bans = [];
      }
    }
    catch (error) {
      console.error(error);
      bans = [];
    }

    this.loadTable('bansTable', bans);
    this.refreshingBansTable = false;
  }

  public async setBans(): Promise<void> {
    this.settingBans = true;

    try {
      await this.daemonService.setBans(...this.bans);
      this.setBansError = '';
      this.setBansSuccess = true;
    }
    catch (error: any) {
      console.error(error);
      this.setBansSuccess = false;
      this.setBansError = `${error}`;
    }

    this.settingBans = false;
  }

  public setCurrentOverviewTab(tab: OverviewTab): void {
    this.currentOverviewTab = tab;
  }

  public setCurrentToolsTab(tab: ToolsTab): void {
    this.currentToolsTab = tab;
  }

  public setCurrentPeersTab(tab: PeersTab): void {
    this.currentPeersTab = tab;
  }

  public setCurrentTorTab(tab: AnonNetTab): void {
    this.currentTorTab = tab;
  }

  public setCurrentI2pTab(tab: AnonNetTab): void {
    this.currentI2pTab = tab;
  }

  public setCurrentP2PoolTab(tab: P2PoolTab): void {
    this.currentP2PoolTab = tab;
  }

  public override ngOnDestroy(): void {
    if (this.netStatsBytesInChart) {
      this.netStatsBytesInChart.destroy();
    }
    if (this.netStatsBytesOutChart) {
      this.netStatsBytesOutChart.destroy();
    }

    if (this.refreshInterval === undefined) return;
    clearInterval(this.refreshInterval);
    this.unregisterScrollEvents();

    super.ngOnDestroy();
  }

  public loadPeersTable(loading: boolean = false): void {
    this.loadTable('peersTable', this.getPeers(), loading);
  }

  public loadSpansTable(loading: boolean = false): void {
    this.loadTable('spansTable', this.getSpans(), loading);
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

  // #region Logs

  private onLog(type: 'monerod' | 'p2pool' | 'i2pd' | 'tor'): void {
    if (type !== 'i2pd' && type !== 'tor') return;
    if (this.scrolling) return;

    this.scrollTableContentToBottom(`${type}-log-table`);
  }

  public clearI2pdLogs(): void{
    this.logsService.clear('i2pd');
  }

  public clearTorLogs(): void{
    this.logsService.clear('tor');
  }

  public clearP2PoolLogs(): void {
    this.logsService.clear('p2pool');
  }

  private registerScrollEvents(): void {
    if (this.scrollEventsRegistered) {
      console.warn("Scroll events already registered");
      return;
    }

    const tabs = this.getTableContents();

    tabs.forEach((tab) => {
      tab.addEventListener('scroll', this.scrollHandler);
      tab.addEventListener('scrollend', this.scrollHandler);
    });

    this.scrollEventsRegistered = true;
  }

  private getTableContents(): HTMLElement[] {
    const table1 = document.getElementById('monerod-log-table');
    const table2 = document.getElementById('i2pd-log-table');
    const table3 = document.getElementById('tor-log-table');
    const table4 = document.getElementById('p2pool-log-table');
    const result: HTMLElement[] = [];

    if (table1) result.push(table1);
    if (table2) result.push(table2);
    if (table3) result.push(table3);
    if (table4) result.push(table4);

    return result;
  }

  private unregisterScrollEvents(): void {
    if (!this.scrollEventsRegistered) {
      console.warn("Scroll events already unregistered");
      return;
    }

    const tabs = this.getTableContents();

    tabs.forEach((tab) => {
      if (!tab) {
        console.warn("Coult not find table content");
        return;
      }
  
      tab.removeEventListener('scroll', this.scrollHandler);
      tab.removeEventListener('scrollend', this.scrollHandler);
    });

    this.scrollEventsRegistered = false;
  }

  // #endregion

  // #region Anon Networks

  private async refreshAnonNetworksInfo(): Promise<void> {
    try {
      await this.refreshTor();
    } catch (error: any) { console.error(error); }
    try {
      await this.refreshI2p();
    } catch (error: any) { console.error(error); }
  }

  // #region Tor

  private resetProcessStats(): void {
    this._torProcessStats = {
      cpu: 0,
      memory: 0,
      ppid: 0,
      pid: 0,
      ctime: 0,
      elapsed: 0,
      timestamp: 0
    };
    this._i2pProcessStats = {
      cpu: 0,
      memory: 0,
      ppid: 0,
      pid: 0,
      ctime: 0,
      elapsed: 0,
      timestamp: 0
    };
  }

  private startLoop() {
    if (this.refreshInterval !== undefined) throw new Error("loop already started");
    this.resetProcessStats();
    this.refreshTor().then(() => {
      this.refreshInterval = setInterval(this.refreshHandler, 5000);
    }).catch((error: any) => console.error(error));
  }

  private async refreshTor(): Promise<void> {
    if (this.refreshingTor || this.torStarting || this.torStopping || !this.torRunning) return;

    this.refreshingTor = true;

    try {
      this.torCircuitEstablished = await this.torService.getCircuitEstablished();
      this.torBootstrapPhase = await this.torService.getBootstrapPhase();
      this._torUptime = await this.torService.getUptime();
      const trafficInfo = await this.torService.getTrafficInfo();

      this.torSent = parseFloat((trafficInfo.sent / 1024).toFixed(2));
      this.torReceived = parseFloat((trafficInfo.received / 1024).toFixed(2));
      this._torProcessStats = await this.torService.getProcessStats();
    }
    catch (error: any) {
      console.error(error);
    }

    this.refreshingTor = false;
  }

  private async refreshI2p(): Promise<void> {
    if (this.refreshing || !this.i2pRunning) return;
    this.refreshing = true;

    try {
      this.mainData = await this.i2pService.getMainData();
      this.localDestinations = await this.i2pService.getLocalDestinations();
      this.i2pTunnels = await this.i2pService.getI2pTunnels();
      this._i2pProcessStats = await this.i2pService.getProcessStats();
    }
    catch (error: any) {
      console.error(error);
    }

    this.refreshing = false;
  }

  public async reloadTor(): Promise<void> {
    try {
      const result = await this.torService.reload();
      console.log('reload tor result: ', result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  public async torChangeIdentity(): Promise<void> {
    try {
      const result = await this.torService.changeIdentity();
      console.log('change identity tor result: ', result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  public async torClearDnsCache(): Promise<void> {
    try {
      const result = await this.torService.clearDnsCache();
      console.log('clear dns cache tor result: ', result);
    }
    catch (error: any) {
      console.error(error);
    }
  }
 
  // #endregion

  // #region I2p

  public async runPeerTest(): Promise<void> {
    try {
      const result = await this.i2pService.runPeerTest();
      console.log(result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  public async reloadTunnelsConfiguration(): Promise<void> {
    try {
      const result = await this.i2pService.reloadTunnelsConfiguration();
      console.log(result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  public async declineTransitTunnels(): Promise<void> {
    try {
      const result = await this.i2pService.declineTransitTunnels();
      console.log(result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  public async setLogLevel(): Promise<void> {
    try {
      const result = await this.i2pService.setLogLevel(this.loggingLevel);
      console.log(result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  // #endregion

  // #endregion

}