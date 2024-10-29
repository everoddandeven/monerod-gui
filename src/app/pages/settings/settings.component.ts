import { Component, NgZone } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonSettings } from '../../../common/DaemonSettings';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { ElectronService } from '../../core/services';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {

  public readonly navbarLinks: NavbarLink[];

  private originalSettings: DaemonSettings;
  public currentSettings: DaemonSettings;

  public savingChanges: boolean = false;
  public savingChangesError = ``;
  public savingChangesSuccess: boolean = false;
  public rpcLoginUser: string;
  public rpcLoginPassword: string;
  public loading: boolean;

  public networkType: 'mainnet' | 'testnet' | 'stagenet' = 'mainnet';

  constructor(private daemonService: DaemonService, private electronService: ElectronService, private ngZone: NgZone) {
    this.loading = true;

    this.navbarLinks = [
      new NavbarLink('pills-general-tab', '#pills-general', 'pills-general', true, 'General', false),
      new NavbarLink('pills-rpc-tab', '#pills-rpc', 'pills-rpc', false, 'RPC', false),
      new NavbarLink('pills-p2p-tab', '#pills-p2p', 'pills-p2p', false, 'P2P', false),
      new NavbarLink('pills-blockchain-tab', '#pills-blockchain', 'pills-blockchain', false, 'Blockchain', false),
      new NavbarLink('pills-mining-tab', '#pills-mining', 'pills-mining', false, 'Mining', false),
      new NavbarLink('pills-logs-tab', '#pills-logs', 'pills-logs', false, 'Logs', false)
    ];
    
    this.originalSettings = new DaemonSettings();
    this.currentSettings = this.originalSettings.clone();
    const loginArgs = this.currentSettings.rpcLogin.split(":");
    if (loginArgs.length == 2) {
      this.rpcLoginPassword = loginArgs[0];
      this.rpcLoginUser = loginArgs[1];
    }
    else {
      this.rpcLoginUser = '';
      this.rpcLoginPassword = '';
    }

    this.load().then(() => {
      console.debug("Settings loaded");
    }).catch((error: any) => {
      console.error(error);
    });
  }

  public isAppImage: boolean = true;

  private async load(): Promise<void> {
    console.log("getting settings");
    this.originalSettings = await this.daemonService.getSettings();
    this.currentSettings = this.originalSettings.clone();
    this.loading = false;

    this.isAppImage = await this.electronService.isAppImage();

    this.networkType = this.currentSettings.mainnet ? 'mainnet' : this.currentSettings.testnet ? 'testnet' : this.currentSettings.stagenet ? 'stagenet' : 'mainnet';
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
    }
    else if (this.networkType == 'testnet') {
      this.currentSettings.mainnet = false;
      this.currentSettings.testnet = true;
      this.currentSettings.stagenet = false;
    }
    else if (this.networkType == 'stagenet') {
      this.currentSettings.mainnet = false;
      this.currentSettings.testnet = false;
      this.currentSettings.stagenet = true;
    }
  }

  private async refreshAutoLanch(minimizeChanged: boolean): Promise<void> {
    if (await this.electronService.isAppImage()) {
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
      if (this.currentSettings.upgradeAutomatically && this.currentSettings.downloadUpgradePath == '') {
        throw new Error('You must set a download path for monerod updates when enabling automatic upgrade');
      }
      
      const oldStartMinimized: boolean = this.originalSettings.startAtLoginMinimized;

      await this.daemonService.saveSettings(this.currentSettings);

      this.originalSettings = this.currentSettings.clone();

      const minimizedChanged: boolean = oldStartMinimized == this.originalSettings.startAtLoginMinimized;

      try {
        await this.refreshAutoLanch(minimizedChanged);
      } catch(error: any) {
        console.error(error);
      }

      this.savingChangesError = ``;
      this.savingChangesSuccess = true;
    }
    catch(error: any) {
      console.error(error);
      this.savingChangesError = `${error}`;
      this.savingChangesSuccess = false;
    }

    this.savingChanges = false;
  }

  public async chooseMonerodFile(): Promise<void> {
    const file = await this.electronService.selectFile();

    if (file == '') {
      return;
    }

    this.ngZone.run(() => {
      this.currentSettings.monerodPath = file;
    });
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

  public async selectSslCertificate(): Promise<void> {
    const cert = await this.choosePemFile();

    if (cert == '') return;

    this.ngZone.run(() => {
      this.currentSettings.rpcSslCertificate = cert;
    });
  }

  public async selectSslCACertificates(): Promise<void> {
    const cert = await this.choosePemFile();

    if (cert == '') return;

    this.ngZone.run(() => {
      this.currentSettings.rpcSslCACertificates = cert;
    });
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

  public async chooseDataDir(): Promise<void> {
    const folder = await this.electronService.selectFolder();

    if (folder == '') {
      return;
    }

    this.ngZone.run(() => {
      this.currentSettings.dataDir = folder;
    });
  }

  public chooseXmrigFile(): void {
    const input = document.getElementById('general-xmrig-path');

    if (!input) {
      return;
    }

    input.click();
  }
}
