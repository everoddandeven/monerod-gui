import { AfterViewInit, Component } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { Router } from '@angular/router';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonSettings } from '../../../common/DaemonSettings';
import { DaemonService } from '../../core/services/daemon/daemon.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements AfterViewInit {

  public readonly navbarLinks: NavbarLink[];
  private originalSettings: DaemonSettings;
  public currentSettings: DaemonSettings;

  public rpcLoginUser: string;
  public rpcLoginPassword: string;
  public loading: boolean;

  public networkType: 'mainnet' | 'testnet' | 'stagenet' = 'mainnet';

  constructor(private router: Router, private navbarService: NavbarService, private daemonService: DaemonService) {
    this.loading = true;

    this.navbarLinks = [
      new NavbarLink('pills-general-tab', '#pills-general', 'pills-general', true, 'General'),
      new NavbarLink('pills-rpc-tab', '#pills-rpc', 'pills-rpc', false, 'RPC'),
      new NavbarLink('pills-p2p-tab', '#pills-p2p', 'pills-p2p', false, 'P2P'),
      new NavbarLink('pills-blockchain-tab', '#pills-blockchain', 'pills-blockchain', false, 'Blockchain'),
      new NavbarLink('pills-mining-tab', '#pills-mining', 'pills-mining', false, 'Mining'),
      new NavbarLink('pills-logs-tab', '#pills-logs', 'pills-logs', false, 'Logs')
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

    this.load();
  }

  private async load(): Promise<void> {
    console.log("getting settings");
    this.originalSettings = await this.daemonService.getSettings();
    this.currentSettings = this.originalSettings.clone();
    this.loading = false;

    this.networkType = this.currentSettings.mainnet ? 'mainnet' : this.currentSettings.testnet ? 'testnet' : this.currentSettings.stagenet ? 'stagenet' : 'mainnet';
  }

  public get modified(): boolean {
    if (!this.currentSettings.equals(this.originalSettings)) {
      return true;
    }

    return false;
  }

  ngAfterViewInit(): void {
      this.navbarService.setLinks(this.navbarLinks);
      this.navbarService.enableLinks();
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
    this.currentSettings.noSync != this.currentSettings.noSync;
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

  public onMonerodPathChange(): void {
    if (document) {
      const element = <HTMLInputElement>document.getElementById('general-monerod-path');
      if (element.files) {
        this.currentSettings.monerodPath = element.files[0].path;
      }
    }
  }

  public async OnSave(): Promise<void> {
    if (!this.modified) {
      return;
    }

    await this.daemonService.saveSettings(this.currentSettings);

    this.originalSettings = this.currentSettings.clone();
  }
}
