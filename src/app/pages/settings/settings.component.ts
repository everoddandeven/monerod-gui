import { AfterViewInit, Component } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonSettings } from '../../../common/DaemonSettings';
import { FormsModule, NgModel } from '@angular/forms';
import { DaemonService } from '../../core/services/daemon/daemon.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements AfterViewInit {

  private readonly navbarLinks: NavbarLink[];
  private originalSettings: DaemonSettings;
  public currentSettings: DaemonSettings;

  public rpcLoginUser: string;
  public rpcLoginPassword: string;
  public loading: boolean;

  public networkType: 'mainnet' | 'testnet' | 'stagenet' = 'mainnet';

  constructor(private router: Router, private navbarService: NavbarService, private daemonService: DaemonService) {
    this.loading = true;

    this.navbarLinks = [
      new NavbarLink('pills-rpc-tab', '#pills-rpc', 'pills-rpc', true, 'RPC'),
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

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url != '/settings') return;
        this.onNavigationEnd();
      }
    });

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
      this.navbarService.setNavbarLinks(this.navbarLinks);
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

  private onNavigationEnd(): void {

  }

  public async OnSave(): Promise<void> {
    if (!this.modified) {
      return;
    }

    await this.daemonService.saveSettings(this.currentSettings);

    this.originalSettings = this.currentSettings.clone();
  }
}
/**
 * --log-file arg (=/home/sidney/.bitmonero/bitmonero.log, /home/sidney/.bitmonero/testnet/bitmonero.log if 'testnet', /home/sidney/.bitmonero/stagenet/bitmonero.log if 'stagenet')
                                        Specify log file
  --log-level arg
  --max-log-file-size arg (=104850000)  Specify maximum log file size [B]
  --max-log-files arg (=50)             Specify maximum number of rotated log 
                                        files to be saved (no limit by setting 
                                        to 0)
  --max-concurrency arg (=0)            Max number of threads to use for a 
                                        parallel job
  --proxy arg                           Network communication through proxy: 
                                        <socks-ip:port> i.e. "127.0.0.1:9050"
  --proxy-allow-dns-leaks               Allow DNS leaks outside of proxy
  --public-node                         Allow other users to use the node as a 
                                        remote (restricted RPC mode, view-only 
                                        commands) and advertise it over P2P
  --zmq-rpc-bind-ip arg (=127.0.0.1)    IP for ZMQ RPC server to listen on
  --zmq-rpc-bind-port arg (=18082, 28082 if 'testnet', 38082 if 'stagenet')
                                        Port for ZMQ RPC server to listen on
  --zmq-pub arg                         Address for ZMQ pub - tcp://ip:port or 
                                        ipc://path
  --no-zmq                              Disable ZMQ RPC server
  --data-dir arg (=/home/sidney/.bitmonero, /home/sidney/.bitmonero/testnet if 'testnet', /home/sidney/.bitmonero/stagenet if 'stagenet')
                                        Specify data directory
  --test-drop-download                  For net tests: in download, discard ALL
                                        blocks instead checking/saving them 
                                        (very fast)
  --test-drop-download-height arg (=0)  Like test-drop-download but discards 
                                        only after around certain height
  --testnet                             Run on testnet. The wallet must be 
                                        launched with --testnet flag.
  --stagenet                            Run on stagenet. The wallet must be 
                                        launched with --stagenet flag.
  --regtest                             Run in a regression testing mode.
  --keep-fakechain                      Don't delete any existing database when
                                        in fakechain mode.
  --fixed-difficulty arg (=0)           Fixed difficulty used for testing.
  --enforce-dns-checkpointing           checkpoints from DNS server will be 
                                        enforced
  --prep-blocks-threads arg (=4)        Max number of threads to use when 
                                        preparing block hashes in groups.
  --fast-block-sync arg (=1)            Sync up most of the way by using 
                                        embedded, known block hashes.
  --show-time-stats arg (=0)            Show time-stats when processing 
                                        blocks/txs and disk synchronization.
  --block-sync-size arg (=0)            How many blocks to sync at once during 
                                        chain synchronization (0 = adaptive).
  --check-updates arg (=notify)         Check for new versions of monero: 
                                        [disabled|notify|download|update]
  --fluffy-blocks                       Relay blocks as fluffy blocks 
                                        (obsolete, now default)
  --no-fluffy-blocks                    Relay blocks as normal blocks
  --test-dbg-lock-sleep arg (=0)        Sleep time in ms, defaults to 0 (off), 
                                        used to debug before/after locking 
                                        mutex. Values 100 to 1000 are good for 
                                        tests.
  --offline                             Do not listen for peers, nor connect to
                                        any
  --disable-dns-checkpoints             Do not retrieve checkpoints from DNS
  --block-download-max-size arg (=0)    Set maximum size of block download 
                                        queue in bytes (0 for default)
  --sync-pruned-blocks                  Allow syncing from nodes with only 
                                        pruned blocks
  --max-txpool-weight arg (=648000000)  Set maximum txpool weight in bytes.
  --block-notify arg                    Run a program for each new block, '%s' 
                                        will be replaced by the block hash
  --prune-blockchain                    Prune blockchain
  --reorg-notify arg                    Run a program for each reorg, '%s' will
                                        be replaced by the split height, '%h' 
                                        will be replaced by the new blockchain 
                                        height, '%n' will be replaced by the 
                                        number of new blocks in the new chain, 
                                        and '%d' will be replaced by the number
                                        of blocks discarded from the old chain
  --block-rate-notify arg               Run a program when the block rate 
                                        undergoes large fluctuations. This 
                                        might be a sign of large amounts of 
                                        hash rate going on and off the Monero 
                                        network, and thus be of potential 
                                        interest in predicting attacks. %t will
                                        be replaced by the number of minutes 
                                        for the observation window, %b by the 
                                        number of blocks observed within that 
                                        window, and %e by the number of blocks 
                                        that was expected in that window. It is
                                        suggested that this notification is 
                                        used to automatically increase the 
                                        number of confirmations required before
                                        a payment is acted upon.
  --keep-alt-blocks                     Keep alternative blocks on restart
  --extra-messages-file arg             Specify file for extra messages to 
                                        include into coinbase transactions
  --start-mining arg                    Specify wallet address to mining for
  --mining-threads arg                  Specify mining threads count
  --bg-mining-enable                    enable background mining
  --bg-mining-ignore-battery            if true, assumes plugged in when unable
                                        to query system power status
  --bg-mining-min-idle-interval arg     Specify min lookback interval in 
                                        seconds for determining idle state
  --bg-mining-idle-threshold arg        Specify minimum avg idle percentage 
                                        over lookback interval
  --bg-mining-miner-target arg          Specify maximum percentage cpu use by 
                                        miner(s)
  --db-sync-mode arg (=fast:async:250000000bytes)
                                        Specify sync option, using format 
                                        [safe|fast|fastest]:[sync|async]:[<nblo
                                        cks_per_sync>[blocks]|<nbytes_per_sync>
                                        [bytes]].
  --db-salvage                          Try to salvage a blockchain database if
                                        it seems corrupted
  --p2p-bind-ip arg (=0.0.0.0)          Interface for p2p network protocol 
                                        (IPv4)
  --p2p-bind-ipv6-address arg (=::)     Interface for p2p network protocol 
                                        (IPv6)
  --p2p-bind-port arg (=18080, 28080 if 'testnet', 38080 if 'stagenet')
                                        Port for p2p network protocol (IPv4)
  --p2p-bind-port-ipv6 arg (=18080, 28080 if 'testnet', 38080 if 'stagenet')
                                        Port for p2p network protocol (IPv6)
  --p2p-use-ipv6                        Enable IPv6 for p2p
  --p2p-ignore-ipv4                     Ignore unsuccessful IPv4 bind for p2p
  --p2p-external-port arg (=0)          External port for p2p network protocol 
                                        (if port forwarding used with NAT)
  --allow-local-ip                      Allow local ip add to peer list, mostly
                                        in debug purposes
  --add-peer arg                        Manually add peer to local peerlist
  --add-priority-node arg               Specify list of peers to connect to and
                                        attempt to keep the connection open
  --add-exclusive-node arg              Specify list of peers to connect to 
                                        only. If this option is given the 
                                        options add-priority-node and seed-node
                                        are ignored
  --seed-node arg                       Connect to a node to retrieve peer 
                                        addresses, and disconnect
  --tx-proxy arg                        Send local txes through proxy: 
                                        <network-type>,<socks-ip:port>[,max_con
                                        nections][,disable_noise] i.e. 
                                        "tor,127.0.0.1:9050,100,disable_noise"
  --anonymous-inbound arg               <hidden-service-address>,<[bind-ip:]por
                                        t>[,max_connections] i.e. 
                                        "x.onion,127.0.0.1:18083,100"
  --ban-list arg                        Specify ban list file, one IP address 
                                        per line
  --hide-my-port                        Do not announce yourself as peerlist 
                                        candidate
  --no-sync                             Don't synchronize the blockchain with 
                                        other peers
  --enable-dns-blocklist                Apply realtime blocklist from DNS
  --no-igd                              Disable UPnP port mapping
  --igd arg (=delayed)                  UPnP port mapping (disabled, enabled, 
                                        delayed)
  --out-peers arg (=-1)                 set max number of out peers
  --in-peers arg (=-1)                  set max number of in peers
  --tos-flag arg (=-1)                  set TOS flag
  --limit-rate-up arg (=2048)           set limit-rate-up [kB/s]
  --limit-rate-down arg (=8192)         set limit-rate-down [kB/s]
  --limit-rate arg (=-1)                set limit-rate [kB/s]
  --pad-transactions                    Pad relayed transactions to help defend
                                        against traffic volume analysis
  --max-connections-per-ip arg (=1)     Maximum number of connections allowed 
                                        from the same IP address
  --rpc-bind-port arg (=18081, 28081 if 'testnet', 38081 if 'stagenet')
                                        Port for RPC server
  --rpc-restricted-bind-port arg        Port for restricted RPC server
  --restricted-rpc                      Restrict RPC to view only commands and 
                                        do not return privacy sensitive data in
                                        RPC calls
  --bootstrap-daemon-address arg        URL of a 'bootstrap' remote daemon that
                                        the connected wallets can use while 
                                        this daemon is still not fully synced.
                                        Use 'auto' to enable automatic public 
                                        nodes discovering and bootstrap daemon 
                                        switching
  --bootstrap-daemon-login arg          Specify username:password for the 
                                        bootstrap daemon login
  --bootstrap-daemon-proxy arg          <ip>:<port> socks proxy to use for 
                                        bootstrap daemon connections
  --rpc-bind-ip arg (=127.0.0.1)        Specify IP to bind RPC server
  --rpc-bind-ipv6-address arg (=::1)    Specify IPv6 address to bind RPC server
  --rpc-restricted-bind-ip arg (=127.0.0.1)
                                        Specify IP to bind restricted RPC 
                                        server
  --rpc-restricted-bind-ipv6-address arg (=::1)
                                        Specify IPv6 address to bind restricted
                                        RPC server
  --rpc-use-ipv6                        Allow IPv6 for RPC
  --rpc-ignore-ipv4                     Ignore unsuccessful IPv4 bind for RPC
  --rpc-login arg                       Specify username[:password] required 
                                        for RPC server
  --confirm-external-bind               Confirm rpc-bind-ip value is NOT a 
                                        loopback (local) IP
  --rpc-access-control-origins arg      Specify a comma separated list of 
                                        origins to allow cross origin resource 
                                        sharing
  --rpc-ssl arg (=autodetect)           Enable SSL on RPC connections: 
                                        enabled|disabled|autodetect
  --rpc-ssl-private-key arg             Path to a PEM format private key
  --rpc-ssl-certificate arg             Path to a PEM format certificate
  --rpc-ssl-ca-certificates arg         Path to file containing concatenated 
                                        PEM format certificate(s) to replace 
                                        system CA(s).
  --rpc-ssl-allowed-fingerprints arg    List of certificate fingerprints to 
                                        allow
  --rpc-ssl-allow-chained               Allow user (via --rpc-ssl-certificates)
                                        chain certificates
  --disable-rpc-ban                     Do not ban hosts on RPC errors
  --rpc-ssl-allow-any-cert              Allow any peer certificate
  --rpc-payment-address arg             Restrict RPC to clients sending 
                                        micropayment to this address
  --rpc-payment-difficulty arg (=1000)  Restrict RPC to clients sending 
                                        micropayment at this difficulty
  --rpc-payment-credits arg (=100)      Restrict RPC to clients sending 
                                        micropayment, yields that many credits 
                                        per payment
  --rpc-payment-allow-free-loopback     Allow free access from the loopback 
                                        address (ie, the local host)

 */