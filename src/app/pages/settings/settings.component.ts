import { AfterViewInit, Component, NgZone } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonSettings, DefaultPrivnetNode2Settings, PrivnetDaemonSettings } from '../../../common';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { ElectronService } from '../../core/services';
import { DaemonSettingsError } from '../../../common';
import { BasePageComponent } from '../base-page/base-page.component';
import { NavbarService } from '../../shared/components';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    standalone: false
})
export class SettingsComponent extends BasePageComponent implements AfterViewInit {

  public readonly navbarLinks: NavbarLink[];

  private removingExclusiveNodes: boolean = false;
  private removingPriorityNodes: boolean = false;

  private addingExclusiveNode: boolean = false;
  private addingPriorityNode: boolean = false;
  private originalSettings: DaemonSettings;
  private _currentSettings: DaemonSettings;
  private readonly _privnetSettings: DefaultPrivnetNode2Settings = new DefaultPrivnetNode2Settings();

  public banListUrl: string = '';
  public remoteBanList: boolean = false;

  public savingChanges: boolean = false;
  public savingChangesError = ``;
  public savingChangesSuccess: boolean = false;

  public rpcLoginUser: string = '';
  public rpcLoginPassword: string = '';
  
  public get rpcLoginError(): string | undefined {
    const userEmpty = this.rpcLoginUser.length === 0;
    const passwordEmpty = this.rpcLoginPassword.length === 0;
    const empty = userEmpty && passwordEmpty;
    if (empty) return undefined;
    if (userEmpty) return 'Must setup RPC user';
    else if (passwordEmpty) return 'Must setup RPC password';

    return undefined;
  }

  public get isValidRpcLogin(): boolean {
    return this.rpcLoginError === undefined;
  }

  public loading: boolean;

  public networkType: 'mainnet' | 'testnet' | 'stagenet' | 'privnet' = 'mainnet';
  
  public get currentSettings(): DaemonSettings {
    if (this.isPrivnet) return this._privnetSettings;
    return this._currentSettings;
  }

  public get isPrivnet(): boolean {
    return this._currentSettings.isPrivnet;
  }

  public successMessage: string = '';
  
  public databaseSyncSpeed: 'safe' | 'fast' | 'fastest' = 'fast';
  public databaseSyncMode: 'sync' | 'async' = 'async';
  public databaseSyncNBytesOrBlocks: number = 250000000;
  public databaseSyncNPerMode: 'bytes' | 'blocks' = 'bytes';
  public isPortable: boolean = true;
  public downloadingBanListFile: boolean = false;

  public exclusiveNodeAddress: string = '';
  public exclusiveNodePort: number = 0;

  public priorityNodeAddress: string = '';
  public priorityNodePort: number = 0;

  public seedNodeAddress: string = '';
  public seedNodePort: number = 0;

  public torTxProxyIp: string = '';
  public torTxProxyPort: number = 0;
  public torTxProxyMaxConnections: number = 10;
  public torTxProxyDisableNoise: boolean = false;

  public get torTxProxy(): string {
    const torTxProxy = `tor,${this.torTxProxyIp}:${this.torTxProxyPort}${this.torTxProxyMaxConnections > 0 ? ',' + this.torTxProxyMaxConnections : ''}${this.torTxProxyDisableNoise ? ',disablenoise' : ''}`;

    if (!DaemonSettings.isValidTorTxProxy(torTxProxy)) return '';

    return torTxProxy;
  }

  public i2pTxProxyIp: string = '';
  public i2pTxProxyPort: number = 0;
  public i2pTxProxyMaxConnections: number = 10;
  public i2pTxProxyDisableNoise: boolean = false;

  public get i2pTxProxy(): string {
    const i2pTxProxy = `i2p,${this.i2pTxProxyIp}:${this.i2pTxProxyPort}${this.i2pTxProxyMaxConnections > 0 ? ',' + this.i2pTxProxyMaxConnections : ''}${this.i2pTxProxyDisableNoise ? ',disablenoise' : ''}`;

    if (!DaemonSettings.isValidI2pTxProxy(i2pTxProxy)) return '';

    return i2pTxProxy;
  }

  public torAnonymousInboundAddress: string = '';
  public torAnonymousInboundPort: number = 0;
  public torAnonymousInboundForwardIp: string = '';
  public torAnonymousInboundForwardPort: number = 0;
  public torAnonymousInboundMaxConnections: number = 0;

  public get torAnonymousInbound(): string {
    const torAnonymousInbound = `${this.torAnonymousInboundAddress}:${this.torAnonymousInboundPort},${this.torAnonymousInboundForwardIp}:${this.torAnonymousInboundForwardPort}${this.torTxProxyMaxConnections > -1 ? ',' + this.torAnonymousInboundMaxConnections : ''}`;
    if (!DaemonSettings.isValidTorAnonymousInbound(torAnonymousInbound)) return '';

    return torAnonymousInbound;
  }

  public i2pAnonymousInboundAddress: string = '';
  public i2pAnonymousInboundPort: number = 0;
  public i2pAnonymousInboundForwardIp: string = '';
  public i2pAnonymousInboundForwardPort: number = 0;
  public i2pAnonymousInboundMaxConnections: number = 0;

  public get i2pAnonymousInbound(): string {
    const i2pAnonymousInbound = `${this.i2pAnonymousInboundAddress}:${this.i2pAnonymousInboundPort},${this.i2pAnonymousInboundForwardIp}:${this.i2pAnonymousInboundForwardPort}${this.i2pTxProxyMaxConnections > -1 ? ',' + this.i2pAnonymousInboundMaxConnections : ''}`;
    if (!DaemonSettings.isValidI2pAnonymousInbound(i2pAnonymousInbound)) return '';

    return i2pAnonymousInbound;
  }

  private get seedNode(): string {
    return `${this.seedNodeAddress}:${this.seedNodePort}`;
  }

  private get exclusiveNodes(): NodeInfo[] {
    const result: { address: string, port: number }[] = [];

    this.currentSettings.exclusiveNodes.forEach((en) => {
      const components = en.split(":");

      if (components.length !== 2) {
        return;
      }

      const [ address, strPort ] = components;

      try {
        const port = parseInt(strPort);

        result.push({ address: address, port: port });
      }
      catch {
        return;
      }

    });

    return result;
  }

  private get priorityNodes(): NodeInfo[] {
    const result: { address: string, port: number }[] = [];

    this.currentSettings.priorityNodes.forEach((en) => {
      const components = en.split(":");

      if (components.length !== 2) {
        return;
      }

      const [ address, strPort ] = components;

      try {
        const port = parseInt(strPort);

        result.push({ address: address, port: port });
      }
      catch {
        return;
      }

    });

    return result;
  }

  private get dbSyncMode(): string {
    return `${this.databaseSyncSpeed}:${this.databaseSyncMode}:${this.databaseSyncNBytesOrBlocks}${this.databaseSyncNPerMode}`;
  }

  // #region Validation

  public get validBanListUrl(): boolean {
    if (this.banListUrl == '') {
      return false;
    }

    try {
      new URL(this.banListUrl);
      return true;
    }
    catch {
      return false;
    }
  }

  public get canAddExclusiveNode(): boolean {
    if (this.addingExclusiveNode) {
      return false;
    }

    if (this.exclusiveNodePort <= 0) {
      return false;
    }

    if (this.exclusiveNodeAddress.trim().replace(' ', '') === '' || this.exclusiveNodeAddress.includes(":")) {
      return false;
    }

    if (this.exclusiveNodes.find((en) => en.address === this.exclusiveNodeAddress && en.port === this.exclusiveNodePort)) {
      return false;
    }

    return true;
  }

  public get canRemoveExclusiveNodes(): boolean {
    if (this.removingExclusiveNodes || this.exclusiveNodes.length === 0) {
      return false;
    }

    return true;
  }

  public get canRemovePriorityNodes(): boolean {
    if (this.removingPriorityNodes || this.priorityNodes.length === 0) {
      return false;
    }

    return true;
  }

  public get canAddPriorityNode(): boolean {
    if (this.addingPriorityNode) {
      return false;
    }

    if (this.priorityNodePort <= 0) {
      return false;
    }

    if (this.priorityNodeAddress.trim().replace(' ', '') === '' || this.priorityNodeAddress.includes(":")) {
      return false;
    }

    if (this.priorityNodes.find((en) => en.address === this.priorityNodeAddress && en.port === this.priorityNodePort)) {
      return false;
    }

    return true;
  }

  public get canEditNodeSettings(): boolean {
    return !this.isPrivnet;
  }

  public get canAddBanList(): boolean {
    return !this.isPrivnet;
  }

  public get canImportConfigFile(): boolean {
    return !this.isPrivnet;
  }

  public get canExportConfigFile(): boolean {
    return !this.isPrivnet;
  }

  // #endregion

  constructor(private daemonService: DaemonService, private electronService: ElectronService, navbarService: NavbarService, private ngZone: NgZone) {
    super(navbarService);
    this.loading = true;

    this.navbarLinks = [
      new NavbarLink('pills-general-tab', '#pills-general', 'pills-general', true, 'General', false),
      new NavbarLink('pills-node-tab', '#pills-node', 'pills-node', false, 'Node', false),
      new NavbarLink('pills-rpc-tab', '#pills-rpc', 'pills-rpc', false, 'RPC', false),
      new NavbarLink('pills-p2p-tab', '#pills-p2p', 'pills-p2p', false, 'P2P', false),
      new NavbarLink('pills-blockchain-tab', '#pills-blockchain', 'pills-blockchain', false, 'Blockchain', false),
      new NavbarLink('pills-mining-tab', '#pills-mining', 'pills-mining', false, 'Mining', false),
      new NavbarLink('pills-logs-tab', '#pills-logs', 'pills-logs', false, 'Logs', false),
      new NavbarLink('pills-tor-tab', '#pills-tor', 'pills-tor', false, 'Tor', false),
      new NavbarLink('pills-i2p-tab', '#pills-i2p', 'pills-i2p', false, 'I2P', false)
    ];
    
    this.originalSettings = new DaemonSettings();
    this._currentSettings = this.originalSettings.clone();

    this.load().then(() => {
      console.debug("Settings loaded");
    }).catch((error: any) => {
      console.error(error);
    });
  }

  public get validTorTxProxy(): boolean {
    return this.torTxProxy !== '';
  }

  public onTorTxProxyChange(): void {
    if (!this.validTorTxProxy) return;

    const torTxProxy = this.torTxProxy;
    
    this._currentSettings.setTxProxy(torTxProxy, 'tor');
  }

  public onI2pTxProxyChange(): void {
    if (!this.validTorTxProxy) return;

    const i2pTxProxy = this.i2pTxProxy;
    
    this._currentSettings.setTxProxy(i2pTxProxy, 'i2p');
  }

  public onTorAnonymousInboundChange(): void {
    if (this.torAnonymousInbound == '') return;

    const torAnonymousInbound = this.torAnonymousInbound;
    
    this._currentSettings.setAnonymousInbound(torAnonymousInbound, 'tor');
  }

  public onI2pAnonymousInboundChange(): void {
    if (this.i2pAnonymousInbound == '') return;

    const i2pAnonymousInbound = this.i2pAnonymousInbound;
    
    this._currentSettings.setAnonymousInbound(i2pAnonymousInbound, 'i2p');
  }

  private refreshI2pAnonymousInbound(): void {
    const i2pProxy = this._currentSettings.anonymousInbounds.i2p;

    if (!DaemonSettings.isValidI2pAnonymousInbound(i2pProxy)) {
      this.i2pAnonymousInboundAddress = '';
      this.i2pAnonymousInboundPort = 0;
      this.i2pAnonymousInboundForwardIp = '';
      this.i2pAnonymousInboundForwardPort = 0;
      this.i2pAnonymousInboundMaxConnections = 10;
      return;
    }

    const components = i2pProxy.replace(`i2p,`, '').split(',');
    const address = components[0];
    const port = components[1];
    const socks = components[2];
    const socksComponent = socks.split(':');
    const socksIp = socksComponent[0];
    const socksPort = socksComponent[1];
    const maxConnections = components[3];

    this.i2pAnonymousInboundAddress = address;
    this.i2pAnonymousInboundPort = parseInt(port);
    this.i2pAnonymousInboundForwardIp = socksIp;
    this.i2pAnonymousInboundForwardPort = parseInt(socksPort);
    
    if (maxConnections) {
      this.i2pAnonymousInboundMaxConnections = parseInt(maxConnections);
    }
  }

  private refreshI2pTxProxy(): void {
    const i2pTxProxy = this._currentSettings.txProxies.i2p;
    if (!DaemonSettings.isValidI2pTxProxy(i2pTxProxy)) {
      this.i2pTxProxyIp = '';
      this.i2pTxProxyPort = 0;
      this.i2pTxProxyMaxConnections = 10;
      this.i2pTxProxyDisableNoise = false;
      return;
    }

    const components = i2pTxProxy.replace('i2p,', '').split(',');
    const socks = components[0];
    const maxConnections = components[1];
    const disableNoise = components[2];    
    const socksComponents = socks.split(':');
    const socksIp = socksComponents[0];
    const socksPort = socksComponents[1];

    this.i2pTxProxyIp = socksIp;
    this.i2pTxProxyPort = parseInt(socksPort);
    this.i2pTxProxyDisableNoise = disableNoise === 'disablenoise';

    if (maxConnections) {
      this.i2pTxProxyMaxConnections = parseInt(maxConnections);
    }
  }

  private refreshTorAnonymousInbound(): void {
    const torProxy = this._currentSettings.anonymousInbounds.tor;

    if (!DaemonSettings.isValidTorAnonymousInbound(torProxy)) {
      this.torAnonymousInboundAddress = '';
      this.torAnonymousInboundPort = 0;
      this.torAnonymousInboundForwardIp = '';
      this.torAnonymousInboundForwardPort = 0;
      this.torAnonymousInboundMaxConnections = 10;
      return;
    }

    const components = torProxy.replace(`tor,`, '').split(',');
    const address = components[0];
    const port = components[1];
    const socks = components[2];
    const socksComponent = socks.split(':');
    const socksIp = socksComponent[0];
    const socksPort = socksComponent[1];
    const maxConnections = components[3];

    this.torAnonymousInboundAddress = address;
    this.torAnonymousInboundPort = parseInt(port);
    this.torAnonymousInboundForwardIp = socksIp;
    this.torAnonymousInboundForwardPort = parseInt(socksPort);
    
    if (maxConnections) {
      this.torAnonymousInboundMaxConnections = parseInt(maxConnections);
    }

  }

  private refreshTorTxProxy(): void {
    const torTxProxy = this._currentSettings.txProxies.tor;
    if (!DaemonSettings.isValidTorTxProxy(torTxProxy)) {
      this.torTxProxyIp = '';
      this.torTxProxyPort = 0;
      this.torTxProxyMaxConnections = 10;
      this.torTxProxyDisableNoise = false;
      return;
    }

    const components = torTxProxy.replace('tor,', '').split(',');
    const socks = components[0];
    const maxConnections = components[1];
    const disableNoise = components[2];    
    const socksComponents = socks.split(':');
    const socksIp = socksComponents[0];
    const socksPort = socksComponents[1];

    this.torTxProxyIp = socksIp;
    this.torTxProxyPort = parseInt(socksPort);
    this.torTxProxyDisableNoise = disableNoise === 'disablenoise';

    if (maxConnections) {
      this.torTxProxyMaxConnections = parseInt(maxConnections);
    }
  }

  private refreshLogin(): void {
    const loginArgs = this._currentSettings.rpcLogin.split(":");
    if (loginArgs.length == 2) {
      this.rpcLoginPassword = loginArgs[1];
      this.rpcLoginUser = loginArgs[0];
    }
    else {
      this.rpcLoginUser = '';
      this.rpcLoginPassword = '';
    }
  }

  public ngAfterViewInit(): void {
    this.loadTables();
  }

  public refreshSyncMode(): void {
    setTimeout(() => {
      this._currentSettings.dbSyncMode = this.dbSyncMode;
    }, 100);
  }

  private initSyncMode(): void {
    if (!this._currentSettings) {
      return;
    }

    const dbSyncMode = this._currentSettings.dbSyncMode;

    if (dbSyncMode == '') {
      return;
    }

    const cmps = dbSyncMode.split(":");

    if (cmps.length != 3) {
      return;
    }

    const speed: 'safe' | 'fast' | 'fastest' = (cmps[0] == 'safe' || cmps[0] == 'fast' || cmps[0] == 'fastest') ? cmps[0] : 'fast';
    const mode: 'sync' | 'async' = (cmps[1] == 'sync' || cmps[1] == 'async') ? cmps[1] : 'async';
    const nPerMode: 'bytes' | 'blocks' = cmps[2].endsWith('blocks') ? 'blocks' : 'bytes';
    const n: number = parseInt(cmps[2].replace(nPerMode, ''));

    this.databaseSyncSpeed = speed;
    this.databaseSyncMode = mode;
    this.databaseSyncNPerMode = nPerMode;
    this.databaseSyncNBytesOrBlocks = n;
  }

  private async load(): Promise<void> {
    this.originalSettings = await this.daemonService.getSettings();
    this._currentSettings = this.originalSettings.clone();

    if (this.seedNode !== '') {
      const components = this.seedNode.split(":");

      if (components.length >= 2) {
        const [node, strPort] = components;

        this.seedNodeAddress = node;
        this.seedNodePort = parseInt(strPort);
      }
      else if (components.length === 1) 
      {
        this.seedNodeAddress = components[0];
      }
    }

    this.initSyncMode();
    
    this.loading = false;

    this.isPortable = await this.electronService.isPortable();
    this.networkType = this._currentSettings.mainnet ? 'mainnet' : this._currentSettings.testnet ? 'testnet' : this._currentSettings.stagenet ? 'stagenet' : this._currentSettings.privnet ? 'privnet' : 'mainnet';
    if (this._privnetSettings.monerodPath == '') this._privnetSettings.setMonerodPath(this._currentSettings.monerodPath);
    this.refreshLogin();
    this.refreshTorAnonymousInbound();
    this.refreshTorTxProxy();
    this.refreshI2pAnonymousInbound();
    this.refreshI2pTxProxy();
  }

  private loadTables(): void {
    setTimeout(() => {
      this.ngZone.run(() => {
        this.loadExclusiveNodesTable();
        this.loadPriorityNodesTable();
      });
    }, 500);
  }

  private loadExclusiveNodesTable(loading: boolean = false): void {
    this.loadTable('exclusiveNodesTable', this.exclusiveNodes, loading);
  }

  private loadPriorityNodesTable(loading: boolean = false): void {
    this.loadTable('priorityNodesTable', this.priorityNodes, loading);
  }

  public get modified(): boolean {
    if (!this._currentSettings.equals(this.originalSettings)) {
      return true;
    }

    return false;
  }

  public get saveDisabled(): boolean {
    return !this.modified || this.daemonService.restarting || this.daemonService.starting || this.daemonService.stopping;
  }

  public onSeedNodeChange() {
    if (this.seedNodePort >= 0) {
      this._currentSettings.seedNode = `${this.seedNodeAddress}:${this.seedNodePort}`;
    }
    else {
      this._currentSettings.seedNode = this.seedNodeAddress;
    }
  }

  public OnOfflineChange() {
    this._currentSettings.offline = !this._currentSettings.offline;
  }

  public OnPublicNodeChange() {
    this._currentSettings.publicNode = !this._currentSettings.publicNode;
  }

  public OnRestrictedRPCChange() {
    this._currentSettings.restrictedRpc = !this._currentSettings.restrictedRpc;
  }

  public OnConfirmExternalBindChange() {
    this._currentSettings.confirmExternalBind = !this._currentSettings.confirmExternalBind;
  }

  public OnIgnoreIPv4Change() {
    this._currentSettings.rpcIgnoreIpv4 = !this._currentSettings.rpcIgnoreIpv4;
  }

  public OnDisableRpcBanChange() {
    this._currentSettings.disableRpcBan = !this._currentSettings.disableRpcBan;
  }

  public OnRpcUseIPv6Change(): void {
    this._currentSettings.rpcUseIpv6 = !this._currentSettings.rpcUseIpv6;
  }

  public OnNoZmqChange(): void {
    this._currentSettings.noZmq = !this._currentSettings.noZmq;
  }

  public OnSyncEnableChange(): void {
    this._currentSettings.noSync = !this._currentSettings.noSync;
  }

  public OnRelayFlufflyBlocksChange(): void {
    this._currentSettings.noFluffyBlocks = !this._currentSettings.noFluffyBlocks;
  }

  public OnNetworkTypeChange(): void {
    const wasPrivnet = this._currentSettings.privnet;

    if (this.networkType == 'mainnet') {
      this._currentSettings.mainnet = true;
      this._currentSettings.testnet = false;
      this._currentSettings.stagenet = false;
      this._currentSettings.privnet = false;
    }
    else if (this.networkType == 'testnet') {
      this._currentSettings.mainnet = false;
      this._currentSettings.testnet = true;
      this._currentSettings.stagenet = false;
      this._currentSettings.privnet = false;
    }
    else if (this.networkType == 'stagenet') {
      this._currentSettings.mainnet = false;
      this._currentSettings.testnet = false;
      this._currentSettings.stagenet = true;
      this._currentSettings.privnet = false;
    }
    else if (this.networkType == 'privnet') {
      this._currentSettings.mainnet = false;
      this._currentSettings.testnet = false;
      this._currentSettings.stagenet = false;
      this._currentSettings.privnet = true;
      this.loadTables();
    }

    if (wasPrivnet) this.loadTables();
  }

  private async refreshAutoLanch(minimizeChanged: boolean): Promise<void> {
    if (await this.electronService.isPortable()) {
      return;
    }

    const enabled = await this.electronService.isAutoLaunchEnabled();

    const shouldEnable = this.originalSettings.startAtLogin && !enabled;
    const shouldDisable = !this.originalSettings.startAtLogin && enabled;
    const shouldUpdate = enabled && minimizeChanged;

    if (shouldEnable) {
      await this.electronService.enableAutoLaunch(this.originalSettings.startAtLoginMinimized);
    }
    else if (shouldDisable) {
      await this.electronService.disableAutoLaunch();
    }
    else if (shouldUpdate) {
      await this.electronService.disableAutoLaunch();
      await this.electronService.enableAutoLaunch(this.originalSettings.startAtLoginMinimized);
    }
  }

  public async OnSave(): Promise<void> {
    if (!this.modified) {
      return;
    }

    this.savingChanges = true;

    try {
      if (this.rpcLoginError) {
        throw new Error(this.rpcLoginError);
      }

      const oldStartMinimized: boolean = this.originalSettings.startAtLoginMinimized;

      await this.daemonService.saveSettings(this._currentSettings);

      this.originalSettings = this._currentSettings.clone();

      const minimizedChanged: boolean = oldStartMinimized != this.originalSettings.startAtLoginMinimized;

      try {
        await this.refreshAutoLanch(minimizedChanged);
      } catch(error: any) {
        console.error(error);
      }

      this.savingChangesError = ``;
      this.successMessage = 'Successfully saved settings';
      this.savingChangesSuccess = true;
    }
    catch(error: any) {
      console.error(error);
      this.successMessage = '';
      this.savingChangesError = `${error}`;
      this.savingChangesSuccess = false;
    }

    this.savingChanges = false;
  }

  private async getMonerodFileSpec(): Promise<{ extensions?: string[]; mimeType: string; }> {
    const { platform } = await this.electronService.getOsType();

    if (platform == 'win32') {
      return { mimeType: 'application/vnd.microsoft.portable-executable', extensions: ['exe']};
    }
    else if (platform == 'darwin') {
      return { mimeType: 'application/octet-stream' };
    }
    else if (platform == 'linux') {
      return { mimeType: 'application/x-executable'};
    }

    throw new Error("Could not get monerod mime type");
  }

  private async getI2pdFileSpec(): Promise<{ extensions?: string[]; mimeType: string; }> {
    const { platform } = await this.electronService.getOsType();

    if (platform == 'win32') {
      return { mimeType: 'application/vnd.microsoft.portable-executable', extensions: ['exe']};
    }
    else if (platform == 'darwin') {
      return { mimeType: 'application/octet-stream' };
    }
    else if (platform == 'linux') {
      return { mimeType: 'application/x-executable'};
    }

    throw new Error("Could not get i2pd mime type");
  }

  public async importMonerodConfigFile(): Promise<void> {
    try {
      try {
        const filePath = await this.electronService.selectFile();

        if (filePath == '') {
          return;
        }
    
        const content = await this.electronService.readFile(filePath);

        const settings = DaemonSettings.parseConfig(content);

        settings.monerodPath = this.originalSettings.monerodPath;
        settings.syncOnWifi = this.originalSettings.syncOnWifi;
        settings.syncPeriodEnabled = this.originalSettings.syncPeriodEnabled;
        settings.syncPeriodFrom = this.originalSettings.syncPeriodFrom;
        settings.syncPeriodTo = this.originalSettings.syncPeriodTo;
        settings.startAtLogin = this.originalSettings.startAtLogin;
        settings.startAtLoginMinimized = this.originalSettings.startAtLoginMinimized;
        settings.upgradeAutomatically = this.originalSettings.upgradeAutomatically;
        settings.downloadUpgradePath = this.originalSettings.downloadUpgradePath;

        this._currentSettings = settings;

        await this.OnSave();

        this.successMessage = 'Succesfully imported settings';
      }
      catch(error: any) {
        this.successMessage = '';

        if (error instanceof DaemonSettingsError) {
          throw error;
        }

        console.error(error);
        throw new Error("Could not parse monerod config file");
      }
    }
    catch(error: any) {
      console.error(error);
      this.successMessage = '';
      this.savingChangesError = `${error}`;
    }
  }

  public async exportMonerodConfigFile(): Promise<void> {
    try {
      const config = this.originalSettings.toConfig();
      const homePath = await this.electronService.getPath('home');
      const resultPath = await this.electronService.saveFile(`${homePath}/monerod.conf`, config);

      if (resultPath == '') {
        return;
      }

      this.successMessage = 'Successfully exported config file to ' + resultPath;
      this.savingChangesError = '';
    }
    catch(error: any) {
      console.error(error);
      this.successMessage = '';
      this.savingChangesError = `${error}`;
    }
  }

  public removeMonerodFile(): void {
    this.currentSettings.monerodPath = '';
  }

  public async chooseMonerodFile(): Promise<void> {
    const spec = await this.getMonerodFileSpec();
    const file = await this.electronService.selectFile(spec.extensions);

    if (file == '') {
      return;
    }

    const valid = await this.daemonService.checkValidMonerodPath(file);
    if (valid) {
      this.ngZone.run(() => {
        const currentSettings = this.currentSettings;
        if (currentSettings instanceof PrivnetDaemonSettings) currentSettings.setMonerodPath(file);
        else currentSettings.monerodPath = file;
      });
    }
    else {
      window.electronAPI.showErrorBox('Invalid monerod path', `Invalid monerod path provided: ${file}`);
    }
  }

  public async chooseI2pdFile(): Promise<void> {
    const spec = await this.getI2pdFileSpec();
    const file = await this.electronService.selectFile(spec.extensions);

    if (file == '') {
      return;
    }

    const valid = await this.daemonService.checkValidI2pdPath(file);
    if (valid) {
      this.ngZone.run(() => {
        const currentSettings = this.currentSettings;
        if (currentSettings instanceof PrivnetDaemonSettings) return;
        else currentSettings.i2pdPath = file;
      });
    }
    else {
      window.electronAPI.showErrorBox('Invalid i2pd path', `Invalid i2pd path provided: ${file}`);
    }
  }

  public async chooseBanListFile(): Promise<void> {
    const file = await this.electronService.selectFile(['txt']);

    if (file == '') {
      return;
    }

    this.ngZone.run(() => {
      this._currentSettings.banList = file;
    });
  }

  public removeBanListFile(): void {
    this._currentSettings.banList = '';
  }

  public async downloadBanListFile(): Promise<void> {
    if (!this.remoteBanList) {
      return;
    }

    this.downloadingBanListFile = true;

    try {
      const destination = await this.electronService.selectFolder();

      if (destination != '') {
        const filePath = await this.electronService.downloadFile(this.banListUrl, destination);

        if (!filePath.endsWith('.txt')) {
          throw new Error("Downloaded file doesn't seem to be a valid ban list txt file");
        }
  
        this._currentSettings.banList = filePath;
        this.remoteBanList = false;
      }
    }
    catch (error: any) {
      console.error(error);
      window.electronAPI.showErrorBox('', `${error}`.replace('Error:', ''));
    }

    this.downloadingBanListFile = false;
  }

  private async choosePemFile(): Promise<string> {
    return await this.electronService.selectFile(['pem', 'PEM']);
  }

  public async selectSslPrivateKey(): Promise<void> {
    const privateKey = await this.choosePemFile();

    if (privateKey == '') return;

    this.ngZone.run(() => {
      this._currentSettings.rpcSslPrivateKey = privateKey;
    });
  }

  public removeSslPrivateKey(): void {
    this._currentSettings.rpcSslPrivateKey = '';
  }

  public async selectSslCertificate(): Promise<void> {
    const cert = await this.choosePemFile();

    if (cert == '') return;

    this.ngZone.run(() => {
      this._currentSettings.rpcSslCertificate = cert;
    });
  }

  public removeSslCertificate(): void {
    this._currentSettings.rpcSslCertificate = '';
  }

  public async selectSslCACertificates(): Promise<void> {
    const cert = await this.choosePemFile();

    if (cert == '') return;

    this.ngZone.run(() => {
      this._currentSettings.rpcSslCACertificates = cert;
    });
  }
  
  public removeSslCACertificates(): void {
    this._currentSettings.rpcSslCACertificates = '';
  }

  public async chooseMoneroDownloadPath(): Promise<void> {
    const folder = await this.electronService.selectFolder();

    if (folder == '')
    {
      return;
    }

    this.ngZone.run(() => {
      this._currentSettings.downloadUpgradePath = folder;
    });
  }

  public removeMoneroDownloadPath(): void {
    this._currentSettings.downloadUpgradePath = '';
  }

  public async chooseDataDir(): Promise<void> {
    const folder = await this.electronService.selectFolder();

    if (folder == '') {
      return;
    }

    this.ngZone.run(() => {
      this._currentSettings.dataDir = folder;
    });
  }

  public removeDataDir(): void {
    this._currentSettings.dataDir = '';
  }

  public chooseXmrigFile(): void {
    const input = document.getElementById('general-xmrig-path');

    if (!input) {
      return;
    }

    input.click();
  }

  public async chooseExtraMessagesFile(): Promise<void> {
    const file = await this.electronService.selectFile(['txt']);

    if (file == '') {
      return;
    }

    this.ngZone.run(() => {
      this._currentSettings.extraMessagesFile = file;
    });
  }

  public removeExtraMessagesFile(): void {
    this._currentSettings.extraMessagesFile = '';
  }

  public async chooseLogFile(): Promise<void> {
    const file = await this.electronService.selectFile(['txt']);

    if (file == '') {
      return;
    }

    this.ngZone.run(() => {
      this._currentSettings.logFile = file;
    });
  }

  public removeLogFile(): void {
    this._currentSettings.logFile = '';
  }

  public addExclusiveNode(): void {
    if (!this.canAddExclusiveNode) {
      return;
    }

    this.addingExclusiveNode = true;

    try {
      const node = `${this.exclusiveNodeAddress}:${this.exclusiveNodePort}`;
    
      this._currentSettings.addExclusiveNode(node);

      this.loadExclusiveNodesTable();
    }
    catch (error: any) {
      console.error(error);
    }

    this.addingExclusiveNode = false;
  }

  public removeSelectedExclusiveNodes(): void {
    if (!this.canRemoveExclusiveNodes) {
      return;
    }

    this.removingExclusiveNodes = true;

    const removed = this.removeTableSelection<NodeInfo>('exclusiveNodesTable', 'address');
    
    removed.forEach((r) => {
      const node = r.port >= 0 ? `${r.address}:${r.port}` : r.address;
      this._currentSettings.removeExclusiveNode(node);
    });
    
    this.loadExclusiveNodesTable();

    this.removingExclusiveNodes = false;
  }

  public addPriorityNode(): void {
    if (!this.canAddPriorityNode) {
      return;
    }

    this.addingPriorityNode = true;

    try {
      const node = `${this.priorityNodeAddress}:${this.priorityNodePort}`;
    
      this._currentSettings.addPriorityNode(node);
      this.loadPriorityNodesTable();
    }
    catch (error: any) {
      console.error(error);
    }

    this.addingPriorityNode = false;
  }

  public removeSelectedPriorityNodes(): void {
    if (!this.canRemovePriorityNodes) {
      return;
    }

    this.removingPriorityNodes = true;

    const removed = this.removeTableSelection<NodeInfo>('priorityNodesTable', 'address');
    
    removed.forEach((r) => {
      const node = r.port >= 0 ? `${r.address}:${r.port}` : r.address;
      this._currentSettings.removePriorityNode(node);
    });
    
    this.loadPriorityNodesTable();

    this.removingPriorityNodes = false;
  }

  public onRpcLoginChange(): void {
    const empty: boolean = this.rpcLoginUser.length === 0 && this.rpcLoginPassword.length === 0;
    if (empty) this._currentSettings.rpcLogin = '';
    else this._currentSettings.rpcLogin = `${this.rpcLoginUser}:${this.rpcLoginPassword}`;
  }

}

interface NodeInfo { address: string, port: number };