import { AfterViewInit, Component, NgZone } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonSettings } from '../../../common';
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
  public currentSettings: DaemonSettings;

  public banListUrl: string = '';
  public remoteBanList: boolean = false;

  public savingChanges: boolean = false;
  public savingChangesError = ``;
  public savingChangesSuccess: boolean = false;
  public rpcLoginUser: string = '';
  public rpcLoginPassword: string = '';
  public loading: boolean;

  public networkType: 'mainnet' | 'testnet' | 'stagenet' | 'privnet' = 'mainnet';

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
      new NavbarLink('pills-logs-tab', '#pills-logs', 'pills-logs', false, 'Logs', false)
    ];
    
    this.originalSettings = new DaemonSettings();
    this.currentSettings = this.originalSettings.clone();

    this.load().then(() => {
      console.debug("Settings loaded");
    }).catch((error: any) => {
      console.error(error);
    });
  }

  private refreshLogin(): void {
    const loginArgs = this.currentSettings.rpcLogin.split(":");
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
      this.currentSettings.dbSyncMode = this.dbSyncMode;
    }, 100);
  }

  private initSyncMode(): void {
    if (!this.currentSettings) {
      return;
    }

    const dbSyncMode = this.currentSettings.dbSyncMode;

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
    this.currentSettings = this.originalSettings.clone();

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
    this.networkType = this.currentSettings.mainnet ? 'mainnet' : this.currentSettings.testnet ? 'testnet' : this.currentSettings.stagenet ? 'stagenet' : 'mainnet';
    this.refreshLogin();
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
    if (!this.currentSettings.equals(this.originalSettings)) {
      return true;
    }

    return false;
  }

  public get saveDisabled(): boolean {
    return !this.modified || this.daemonService.restarting || this.daemonService.starting || this.daemonService.stopping;
  }

  public onSeedNodeChange() {
    if (this.seedNodePort >= 0) {
      this.currentSettings.seedNode = `${this.seedNodeAddress}:${this.seedNodePort}`;
    }
    else {
      this.currentSettings.seedNode = this.seedNodeAddress;
    }
  }

  public OnOfflineChange() {
    this.currentSettings.offline = !this.currentSettings.offline;
  }

  public OnPublicNodeChange() {
    this.currentSettings.publicNode = !this.currentSettings.publicNode;
  }

  public OnRestrictedRPCChange() {
    this.currentSettings.restrictedRpc = !this.currentSettings.restrictedRpc;
  }

  public OnConfirmExternalBindChange() {
    this.currentSettings.confirmExternalBind = !this.currentSettings.confirmExternalBind;
  }

  public OnIgnoreIPv4Change() {
    this.currentSettings.rpcIgnoreIpv4 = !this.currentSettings.rpcIgnoreIpv4;
  }

  public OnDisableRpcBanChange() {
    this.currentSettings.disableRpcBan = !this.currentSettings.disableRpcBan;
  }

  public OnRpcUseIPv6Change(): void {
    this.currentSettings.rpcUseIpv6 = !this.currentSettings.rpcUseIpv6;
  }

  public OnNoZmqChange(): void {
    this.currentSettings.noZmq = !this.currentSettings.noZmq;
  }

  public OnSyncEnableChange(): void {
    this.currentSettings.noSync = !this.currentSettings.noSync;
  }

  public OnRelayFlufflyBlocksChange(): void {
    this.currentSettings.noFluffyBlocks = !this.currentSettings.noFluffyBlocks;
  }

  public OnNetworkTypeChange(): void {
    if (this.networkType == 'mainnet') {
      this.currentSettings.mainnet = true;
      this.currentSettings.testnet = false;
      this.currentSettings.stagenet = false;
      this.currentSettings.privnet = false;
    }
    else if (this.networkType == 'testnet') {
      this.currentSettings.mainnet = false;
      this.currentSettings.testnet = true;
      this.currentSettings.stagenet = false;
      this.currentSettings.privnet = false;
    }
    else if (this.networkType == 'stagenet') {
      this.currentSettings.mainnet = false;
      this.currentSettings.testnet = false;
      this.currentSettings.stagenet = true;
      this.currentSettings.privnet = false;
    }
    else if (this.networkType == 'privnet') {
      this.currentSettings.mainnet = false;
      this.currentSettings.testnet = false;
      this.currentSettings.stagenet = false;
      this.currentSettings.privnet = true;
    }
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
      const oldStartMinimized: boolean = this.originalSettings.startAtLoginMinimized;

      await this.daemonService.saveSettings(this.currentSettings);

      this.originalSettings = this.currentSettings.clone();

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

        this.currentSettings = settings;

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
        this.currentSettings.monerodPath = file;
      });
    }
    else {
      window.electronAPI.showErrorBox('Invalid monerod path', `Invalid monerod path provided: ${file}`);
    }
  }

  public async chooseBanListFile(): Promise<void> {
    const file = await this.electronService.selectFile(['txt']);

    if (file == '') {
      return;
    }

    this.ngZone.run(() => {
      this.currentSettings.banList = file;
    });
  }

  public removeBanListFile(): void {
    this.currentSettings.banList = '';
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
  
        this.currentSettings.banList = filePath;
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
      this.currentSettings.rpcSslPrivateKey = privateKey;
    });
  }

  public removeSslPrivateKey(): void {
    this.currentSettings.rpcSslPrivateKey = '';
  }

  public async selectSslCertificate(): Promise<void> {
    const cert = await this.choosePemFile();

    if (cert == '') return;

    this.ngZone.run(() => {
      this.currentSettings.rpcSslCertificate = cert;
    });
  }

  public removeSslCertificate(): void {
    this.currentSettings.rpcSslCertificate = '';
  }

  public async selectSslCACertificates(): Promise<void> {
    const cert = await this.choosePemFile();

    if (cert == '') return;

    this.ngZone.run(() => {
      this.currentSettings.rpcSslCACertificates = cert;
    });
  }
  
  public removeSslCACertificates(): void {
    this.currentSettings.rpcSslCACertificates = '';
  }

  public async chooseMoneroDownloadPath(): Promise<void> {
    const folder = await this.electronService.selectFolder();

    if (folder == '')
    {
      return;
    }

    this.ngZone.run(() => {
      this.currentSettings.downloadUpgradePath = folder;
    });
  }

  public removeMoneroDownloadPath(): void {
    this.currentSettings.downloadUpgradePath = '';
  }

  public async chooseDataDir(): Promise<void> {
    const folder = await this.electronService.selectFolder();

    if (folder == '') {
      return;
    }

    this.ngZone.run(() => {
      this.currentSettings.dataDir = folder;
    });
  }

  public removeDataDir(): void {
    this.currentSettings.dataDir = '';
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
      this.currentSettings.extraMessagesFile = file;
    });
  }

  public removeExtraMessagesFile(): void {
    this.currentSettings.extraMessagesFile = '';
  }

  public async chooseLogFile(): Promise<void> {
    const file = await this.electronService.selectFile(['txt']);

    if (file == '') {
      return;
    }

    this.ngZone.run(() => {
      this.currentSettings.logFile = file;
    });
  }

  public removeLogFile(): void {
    this.currentSettings.logFile = '';
  }

  public addExclusiveNode(): void {
    if (!this.canAddExclusiveNode) {
      return;
    }

    this.addingExclusiveNode = true;

    try {
      const node = `${this.exclusiveNodeAddress}:${this.exclusiveNodePort}`;
    
      this.currentSettings.addExclusiveNode(node);

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
      this.currentSettings.removeExclusiveNode(node);
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
    
      this.currentSettings.addPriorityNode(node);
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
      this.currentSettings.removePriorityNode(node);
    });
    
    this.loadPriorityNodesTable();

    this.removingPriorityNodes = false;
  }

  public onRpcLoginChange(): void {
    this.currentSettings.rpcLogin = `${this.rpcLoginUser}:${this.rpcLoginPassword}`;
  }

}

interface NodeInfo { address: string, port: number };