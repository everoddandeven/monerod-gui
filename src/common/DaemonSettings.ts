export class DaemonSettings {
  public monerodPath: string = '';

  public startAtLogin: boolean = false;
  public startAtLoginMinimized: boolean = false;

  public syncOnWifi: boolean = true;
  public syncPeriodEnabled: boolean = false;
  public syncPeriodFrom: string = '00:00';
  public syncPeriodTo: string = '00:00';

  public runOnBattery: boolean = true;
  public batteryLevelThreshold: number = 0;

  public upgradeAutomatically: boolean = false;
  public downloadUpgradePath: string = '';

  public logFile: string = '';
  public logLevel: number = 0;
  public maxLogFileSize: number = 104850000;
  public maxLogFiles: number = 50;

  public maxConcurrency: number = 0;
  public proxy: string = '';
  public proxyAllowDnsLeaks: boolean = false;
  public publicNode: boolean = false;

  public zmqRpcBindIp: string = '';
  public zmqRpcBindPort: number = 0;
  public zmqPub: string = '';
  public noZmq: boolean = false;
  
  public testDropDownload: boolean = false;
  public testDropDownloadHeight: number = 0;

  public testDbgLockSleep: number = 0;
  
  public testnet: boolean = false;
  public mainnet: boolean = true;
  public stagenet: boolean = false;

  public regtest: boolean = false;

  public dataDir: string = '';
  
  public keepFakeChain: boolean = false;
  public fixedDifficulty: number = 0;
  public enforceDnsCheckpoint: boolean = false;
  public prepBlocksThreads: number = 0;
  public fastBlockSync: boolean = false;
  public showTimeStats: boolean = false;
  public blockSyncSize: number = 0;
  public checkUpdates: 'disabled' | 'notify' | 'download' | 'update' = 'notify';
  public fluffyBlocks: boolean = true;
  public noFluffyBlocks: boolean = false;

  public offline: boolean = false;
  public disableDnsCheckpoints: boolean = false;

  public blockDownloadMaxSize: number = 0;
  public syncPrunedBlocks: boolean = false;
  public maxTxPoolWeight: number = 648000000;
  public blockNotify: string = '';
  public pruneBlockchain: boolean = false;

  public reorgNotify: string = '';
  public blockRateNotify: string = '';

  public keepAltBlocks: boolean = false;
  public extraMessagesFile: string = '';

  public startMining: string = '';
  public miningThreds: number = 0;
  
  public bgMiningEnable: boolean = false;
  public bgMiningIgnoreBattery: boolean = false;
  public bgMiningMinIdleInterval: number = 0;
  public bgMiningIdleThreshold: number = 0;
  public bgMiningMinerTarget: number = 0;

  public dbSyncMode: string = 'fast:async:250000000bytes';
  public dbSalvage: boolean = false;

  public p2pBindIp: string = '0.0.0.0';
  public p2pBindIpv6Address: string = "::";
  public p2pBindPort: number = 0;
  public p2pBindPortIpv6: number = 0;
  public p2pUseIpv6: boolean = false;
  public p2pIgnoreIpv4: boolean = false;
  public p2pExternalPort: number = 0;
  public allowLocalIp: boolean = false;
  public addPeer: string = '';
  public addPriorityNode: string = '';
  public addExclusiveNode: string = '';

  public seedNode: string = '';
  public txProxy: string = '';
  public anonymousInbound: string = '';

  public banList: string = '';
  public hideMyPort: boolean = false;

  public noSync: boolean = false;

  public enableDnsBlocklist: boolean = false;
  public noIgd: boolean = false;
  public igd: 'disable' | 'enabled' | 'delayed' = 'delayed';
  public outPeers: number = -1;
  public inPeers: number = -1;
  public tosFlag: number = -1;
  
  public limitRateUp: number = 2048;
  public limitRateDown: number = 8192;
  public limitRate: number = -1;

  public padTransactions: boolean = false;
  public maxConnectionsPerIp: number = 1;

  public rpcBindPort: number = 0;
  public restrictedBindPort: number = 0;
  public restrictedRpc: boolean = false;

  public bootstrapDaemonAddress: string = '';
  public bootstrapDaemonLogin: string = '';
  public bootstrapDaemonProxy: string = '';

  public confirmExternalBind: boolean = false;

  public rpcBindIp: string = '127.0.0.1';
  public rpcBindIpv6Address: string = '::1';
  public rpcRestrictedBindIp: string = '';
  public rpcUseIpv6: boolean = false;
  public rpcIgnoreIpv4: boolean = false;
  public rpcLogin: string = '';
  public rpcAccessControlOrigins: string = '';
  public rpcSsl: 'autodetect' | 'enabled' | 'disabled' = 'autodetect';
  public rpcSslPrivateKey: string = '';
  public rpcSslCertificate: string = '';
  public rpcSslCACertificates: string = '';
  public rpcAllowedFingerprints: string = '';
  public rpcSslAllowChained: boolean = false;
  public rpcSslAllowAnyCert: boolean = false;
  public rpcPaymentAddress: string = '';
  public rpcPaymentDifficuly: number = 1000;
  public rpcPaymentCredits: number = 100;
  public rpcPaymentAllowFreeLoopback: boolean = false;
  public disableRpcBan: boolean = false;

  public equals(settings: DaemonSettings): boolean {
    //return this.toCommandOptions().join('') == settings.toCommandOptions().join('');
    return this.deepEqual(this, settings);
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    // Se sono lo stesso riferimento, sono uguali
    if (obj1 === obj2) return true;

    // Se uno dei due è nullo o non sono oggetti, non sono uguali
    if (obj1 == null || obj2 == null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return false;
    }

    // Ottieni tutte le chiavi degli oggetti
    const keys1 = Object.keys(<object>obj1);
    const keys2 = Object.keys(<object>obj2);

    // Se hanno un numero diverso di chiavi, non sono uguali
    if (keys1.length !== keys2.length) return false;

    // Controlla che ogni chiave e valore sia equivalente
    for (const key of keys1) {
        // Se una chiave di obj1 non esiste in obj2, non sono uguali
        if (!keys2.includes(key)) return false;

        // Se il valore della proprietà non è uguale, effettua un confronto ricorsivo
        if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  }

  public clone(): DaemonSettings {
    return Object.assign(new DaemonSettings(), this);
  }

  public static parse(data: any): DaemonSettings {
    const settings = new DaemonSettings();
    Object.assign(settings, data);
    return settings;
  }

  public toConfig(): string {
    const commandOptions = this.toCommandOptions();
    const lines: string[] = [];

    commandOptions.forEach((commandOption: string, i: number, array: string[]) => {
      if (commandOption.startsWith('--')) {
        const next: string | undefined = array[i + 1];

        if (!next || next.startsWith('--')) {
          // option without parameter
          lines.push(commandOption.includes('=') ? `${commandOption.replace('--', '')}` : `${commandOption.replace('--', '')}=1`);
        }
        else {
          lines.push(`${commandOption.replace('--', '')}=${next}`);
        }
      }
    });

    return lines.join('\n');
  }

  public static parseConfig(configTxt: string): DaemonSettings {
    const settings = new DaemonSettings();
    const lines = configTxt.split('\n');

    lines.forEach(line => {
        line = line.trim();

        // Ignore comments and empty lines
        if (line.startsWith('#') || line === '') return;

        const [key, value] = line.split('=').map(part => part.trim());
        
        const boolValue = value === '1'; // Interpret 1 as true, 0 as false

        switch (key) {
            case 'data-dir': settings.dataDir = value; break;
            case 'log-file': settings.logFile = value; break;
            case 'log-level': settings.logLevel = parseInt(value, 10); break;
            case 'max-log-files': settings.maxLogFileSize = parseInt(value, 10); break;
            case 'max-log-file-size': settings.maxLogFileSize = parseInt(value, 10); break;
            case 'no-igd': settings.noIgd = boolValue; break;
            case 'enable-dns-blocklist': settings.enableDnsBlocklist = boolValue; break;
            case 'testnet': settings.testnet = boolValue; break;
            case 'mainnet': settings.mainnet = boolValue; break;
            case 'stagenet': settings.stagenet = boolValue; break;
            case 'offline': settings.offline = boolValue; break;
            case 'limit-rate': settings.limitRate = parseInt(value, 10); break;
            case 'limit-rate-up': settings.limitRateUp = parseInt(value, 10); break;
            case 'limit-rate-down': settings.limitRateDown = parseInt(value, 10); break;
            case 'proxy': settings.proxy = value; break;
            case 'proxy-allow-dns-leaks': settings.proxyAllowDnsLeaks = boolValue; break;
            case 'p2p-bind-ip': settings.p2pBindIp = value; break;
            case 'p2p-bind-ipv6-address': settings.p2pBindIpv6Address = value; break;
            case 'p2p-bind-port': settings.p2pBindPort = parseInt(value, 10); break;
            case 'p2p-use-ipv6': settings.p2pUseIpv6 = boolValue; break;
            case 'add-peer': settings.addPeer = value; break;
            case 'add-priority-node': settings.addPriorityNode = value; break;
            case 'bootstrap-daemon-address': settings.bootstrapDaemonAddress = value; break;
            case 'bootstrap-daemon-login': settings.bootstrapDaemonLogin = value; break;
            case 'bootstrap-daemon-proxy': settings.bootstrapDaemonProxy = value; break;
            case 'rpc-bind-ip': settings.rpcBindIp = value; break;
            case 'rpc-bind-port': settings.rpcBindPort = parseInt(value, 10); break;
            case 'confirm-external-bind': settings.confirmExternalBind = boolValue; break;
            case 'disable-dns-checkpoints': settings.disableDnsCheckpoints = boolValue; break;
            case 'sync-pruned-blocks': settings.syncPrunedBlocks = boolValue; break;
            case 'max-concurrency': settings.maxConcurrency = parseInt(value, 10); break;
            case 'check-updates': settings.checkUpdates = value as 'disabled' | 'notify' | 'download' | 'update'; break;
            case 'db-sync-mode': settings.dbSyncMode = value; break;
            case 'db-salvage': settings.dbSalvage = boolValue; break;
            case 'regtest': settings.regtest = boolValue; break;
            case 'pad-transactions': settings.padTransactions = boolValue; break;
            case 'anonymous-inbound': settings.anonymousInbound = value; break;
            case 'fluffy-blocks': settings.fluffyBlocks = boolValue; break;
            case 'no-fluffy-blocks': settings.noFluffyBlocks = boolValue; break;
            case 'tx-proxy': settings.txProxy = value; break;
            case 'max-txpool-weight': settings.maxTxPoolWeight = parseInt(value, 10); break;
            case 'public-node': settings.publicNode = boolValue; break;
            case 'allow-local-ip': settings.allowLocalIp = boolValue; break;
            case 'tos-flag': settings.tosFlag = parseInt(value, 10); break;
            case 'max-connections-per-ip': settings.maxConnectionsPerIp = parseInt(value, 10); break;
            case 'disable-rpc-ban': settings.disableRpcBan = boolValue; break;
            case 'rpc-access-control-origins': settings.rpcAccessControlOrigins = value; break;
            case 'rpc-ssl': settings.rpcSsl = value as 'autodetect' | 'enabled' | 'disabled'; break;
            case 'rpc-ssl-private-key': settings.rpcSslPrivateKey = value; break;
            case 'rpc-ssl-certificate': settings.rpcSslCertificate = value; break;
            case 'rpc-ssl-ca-certificates': settings.rpcSslCACertificates = value; break;
            case 'rpc-ssl-allow-chained': settings.rpcSslAllowChained = boolValue; break;
            case 'rpc-ssl-allow-any-cert': settings.rpcSslAllowAnyCert = boolValue; break;
            case 'rpc-allowed-fingerprints': settings.rpcAllowedFingerprints = value; break;
            case 'rpc-payment-allow-free-loopback': settings.rpcPaymentAllowFreeLoopback = boolValue; break;
            case 'rpc-payment-difficulty': settings.rpcPaymentDifficuly = parseInt(value, 10); break;
            case 'rpc-payment-credits': settings.rpcPaymentCredits = parseInt(value, 10); break;
            case 'extra-messages-file': settings.extraMessagesFile = value; break;
            case 'seed-node': settings.seedNode = value; break;
            case 'zmq-rpc-bind-ip': settings.zmqRpcBindIp = value; break;
            case 'zmq-rpc-bind-port': settings.zmqRpcBindPort = parseInt(value, 10); break;
            case 'zmq-pub': settings.zmqPub = value; break;
            case 'rpc-payment-address': settings.rpcPaymentAddress = value; break;
            case 'no-zmq': settings.noZmq = boolValue; break;
            case 'fixed-difficulty': settings.fixedDifficulty = parseInt(value, 10); break;
            case 'prep-blocks-threads': settings.prepBlocksThreads = parseInt(value, 10); break;
            case 'fast-block-sync': settings.fastBlockSync = boolValue; break;
            case 'block-notify': settings.blockNotify = value; break;
            case 'show-time-stats': settings.showTimeStats = boolValue; break;
            case 'block-sync-size': settings.blockSyncSize = parseInt(value, 10); break;
            case 'block-rate-notify': settings.blockRateNotify = value; break;
            case 'reorg-notify': settings.reorgNotify = value; break;
            case 'prune-blockchain': settings.pruneBlockchain = boolValue; break;
            case 'keep-alt-blocks': settings.keepAltBlocks = boolValue; break;
            case 'keep-fake-chain': settings.keepFakeChain = boolValue; break;
            case 'add-exclusive-node': settings.addExclusiveNode = value; break;
            case 'no-sync': settings.noSync = boolValue; break;
            case 'start-mining': settings.startMining = value; break;
            case 'mining-threads': settings.miningThreds = parseInt(value, 10); break;
            case 'bg-mining-enable': settings.bgMiningEnable = boolValue; break;
            case 'bg-mining-ignore-battery': settings.bgMiningIgnoreBattery = boolValue; break;
            case 'bg-mining-idle-threshold': settings.bgMiningIdleThreshold = parseInt(value, 10); break;
            case 'bg-mining-miner-target': settings.bgMiningMinerTarget = parseInt(value, 10); break;
            case 'hide-my-port': settings.hideMyPort = boolValue; break;
            case 'enforce-dns-checkpoint': settings.enforceDnsCheckpoint = boolValue; break;
            case 'test-drop-download': settings.testDropDownload = boolValue; break;
            case 'test-drop-download-height': settings.testDropDownloadHeight = parseInt(value, 10); break;
            case 'test-dbg-lock-sleep': settings.testDbgLockSleep = parseInt(value, 10); break;
            case 'in-peers': settings.inPeers = parseInt(value, 10); break;
            case 'out-peers': settings.outPeers = parseInt(value, 10); break;

            default: throw new Error(`Invalid setting: ${key}`);
        }
    });

    return settings;
  }

  public static validateConfigFormat(confixTxt: string): boolean {
    try {
      DaemonSettings.parseConfig(confixTxt);

      return true;
    }
    catch(error: any) {
      console.warn(error);
      return false;
    }
  }

  public toCommandOptions(): string[] {
    const options: string[] = [];
    if (this.monerodPath != '') options.push(this.monerodPath);

    if (this.testnet) options.push(`--testnet`);
    else if (this.stagenet) options.push(`--stagenet`);
    else if (!this.mainnet) {
      throw new Error("Invalid daemon settings");
    }

    if (this.logFile != '') options.push('--log-file', this.logFile);
    if (this.logLevel >= 0 && this.logLevel <= 4) options.push('--log-level', `${this.logLevel}`);
    if (this.maxLogFileSize >= 0) options.push(`--max-log-file-size=${this.maxLogFileSize}`);
    if (this.maxLogFiles >= 0) options.push(`--max-log-files=${this.maxLogFiles}`);
    if (this.maxConcurrency) options.push(`--max-concurrency=${this.maxConcurrency}`);
    if (this.dataDir != '') options.push(`--data-dir`, `${this.dataDir}`);
    if (this.proxy != '') options.push(`--proxy=${this.proxy}`);
    if (this.proxyAllowDnsLeaks) options.push(`--proxy-allow-dns-leaks`);
    if (this.publicNode) options.push(`--public-node`);
    if (this.noZmq) options.push(`--no-zmq`);
    if (!this.noZmq && this.zmqRpcBindIp != '') options.push(`--zmq-rpc-bind-ip`, this.zmqRpcBindIp);
    if (!this.noZmq && this.zmqRpcBindPort) options.push(`--zmq-rpc-bind-port`, `${this.zmqRpcBindPort}`);
    if (!this.noZmq && this.zmqPub != '') options.push(`--zmq-pub`, this.zmqPub);
    if (this.testDropDownload) options.push(`--test-drop-download`);
    if (this.testDropDownload && this.testDropDownloadHeight) options.push(`--test-drop-download-height`);
    if (this.testDbgLockSleep) options.push(`--tet-dbg-lock-sleep`, `${this.testDbgLockSleep}`);
    if (this.regtest) options.push(`--regtest`);
    if (this.keepFakeChain) options.push(`--keep-fakechain`);
    if (this.fixedDifficulty) options.push(`--fixed-difficulty`, `${this.fixedDifficulty}`);
    if (this.enforceDnsCheckpoint) options.push(`--enforce-dns-checkpoint`);
    if (this.prepBlocksThreads) options.push(`--prep-blocks-threads`, `${this.prepBlocksThreads}`);
    if (!this.noSync && this.fastBlockSync) options.push(`--fast-block-sync`, `1`);
    if (this.showTimeStats) options.push(`--show-time-stats`);
    if (!this.noSync && this.blockSyncSize) options.push(`--block-sync-size`, `${this.blockSyncSize}`);
    if (this.checkUpdates) options.push(`--check-updates`, this.checkUpdates);
    if (this.noFluffyBlocks) options.push(`--no-fluffy-blocks`);
    if (this.offline) options.push(`--offline`);
    if (this.disableDnsCheckpoints) options.push(`--disable-dns-checkpoints`);
    if (this.blockDownloadMaxSize >= 0) options.push(`--block-download-max-size`, `${this.blockDownloadMaxSize}`);
    if (!this.noSync && this.syncPrunedBlocks) options.push(`--sync-pruned-blocks`);
    if (this.maxTxPoolWeight) options.push(`--max-txpool-weight`, `${this.maxTxPoolWeight}`);
    if (this.blockNotify != '') options.push(`--block-notify`, this.blockNotify);
    if (this.pruneBlockchain) options.push('--prune-blockchain');
    if (this.reorgNotify != '') options.push(`--reorg-notify`, this.reorgNotify);
    if (this.blockRateNotify != '') options.push(`--block-rate-notify`, this.blockRateNotify);
    if (this.keepAltBlocks) options.push(`--keep-alt-blocks`);
    if (this.extraMessagesFile != '') options.push(`--extra-messages-file`, this.extraMessagesFile);
    if (this.startMining != '') options.push(`--start-mining`, this.startMining);
    if (this.miningThreds) options.push(`--mining-threads`, `${this.miningThreds}`);
    if (this.bgMiningEnable) options.push(`--bg-mining-enable`);
    if (this.bgMiningIgnoreBattery) options.push(`--bg-mining-ignore-battery`);
    if (this.bgMiningIdleThreshold) options.push(`--bg-mining-idle-threshold`, `${this.bgMiningIdleThreshold}`);
    if (this.bgMiningMinIdleInterval) options.push(`--bg-mining-idle-interval`, `${this.bgMiningMinIdleInterval}`);
    if (this.bgMiningMinerTarget) options.push(`--bg-mining-miner-target`, `${this.bgMiningMinerTarget}`);
    if (!this.noSync && this.dbSyncMode != '') options.push(`--db-sync-mode`, `${this.dbSyncMode}`);
    if (this.dbSalvage) options.push(`--db-salvage`);
    if (this.p2pBindIp != '') options.push(`--p2p-bind-ip`, this.p2pBindIp);
    if (this.p2pBindIpv6Address != '') options.push(`--p2p-bind-ipv6-address`, this.p2pBindIpv6Address);
    if (this.p2pBindPort > 0) options.push(`--p2p-bind-port`, `${this.p2pBindPort}`);
    if (this.p2pBindPortIpv6 > 0) options.push(`--p2p-bind-port-ipv6`, `${this.p2pBindPortIpv6}`);
    if (this.p2pUseIpv6) options.push(`--p2p-use-ipv6`);
    if (this.p2pIgnoreIpv4) options.push(`--p2p-ignore-ipv4`);
    if (this.p2pExternalPort > 0) options.push(`--p2p-external-port`, `${this.p2pExternalPort}`);
    if (this.allowLocalIp) options.push(`--allow-local-ip`);
    if (this.addPeer != '') options.push('--add-peer', this.addPeer);
    if (this.addPriorityNode != '') options.push(`--add-priority-node`, this.addPriorityNode);
    if (this.addExclusiveNode != '') options.push(`--add-exlcusive-node`, this.addExclusiveNode);
    if (this.seedNode != '') options.push(`--seed-node`, this.seedNode);
    if (this.txProxy != '') options.push(`--tx-proxy`, this.txProxy);
    if (this.anonymousInbound != '') options.push(`--anonymous-inbound`, this.anonymousInbound);
    if (this.banList != '') options.push(`--ban-list`, this.banList);
    if (this.hideMyPort) options.push(`--hide-my-port`);
    if (this.noSync) options.push(`--no-sync`);
    if (this.enableDnsBlocklist) options.push(`--enable-dns-blocklist`);
    if (this.noIgd) options.push(`--no-igd`);
    if (this.outPeers >= 0) options.push(`--out-peers`, `${this.outPeers}`);
    if (this.inPeers >= 0) options.push(`--in-peers`, `${this.inPeers}`);
    if (this.tosFlag >= 0) options.push(`--tos-flag`, `${this.tosFlag}`);
    if (this.limitRate >= 0) options.push(`--limit-rate`, `${this.limitRate}`);
    if (this.limitRateUp >= 0) options.push(`--limit-rate-up`, `${this.limitRateUp}`);
    if (this.limitRateDown >= 0) options.push(`--limit-rate-down`, `${this.limitRateDown}`);
    if (this.padTransactions) options.push(`--pad-transactions`);
    if (this.maxConnectionsPerIp >= 0) options.push(`--max-connections-per-ip`, `${this.maxConnectionsPerIp}`);
    if (this.rpcBindIp != '') options.push(`--rpc-bind-ip`, `${this.rpcBindIp}`);
    if (this.rpcBindPort) options.push(`--rpc-bind-ip`, `${this.rpcBindIp}`);
    if (this.restrictedBindPort) options.push(`--restricted-bind-port`, `${this.restrictedBindPort}`);
    if (this.restrictedRpc) options.push(`--restricted-rpc`);
    if (this.bootstrapDaemonAddress != '') options.push(`--bootstrap-daemon-address`, this.bootstrapDaemonAddress);
    if (this.bootstrapDaemonLogin != '') options.push(`--bootstrap-daemon-login`, this.bootstrapDaemonLogin);
    if (this.bootstrapDaemonProxy != '') options.push(`--bootstrap-daemon-proxy`, this.bootstrapDaemonProxy);
    if (this.confirmExternalBind) options.push(`--confirm-external-bind`);
    if (this.rpcAccessControlOrigins != '') options.push(`--rpc-access-control-origins=${this.rpcAccessControlOrigins}`);
    if (this.rpcSsl) options.push(`--rpc-ssl`, this.rpcSsl);
    if (this.rpcSslPrivateKey != '') options.push(`--rpc-ssl-private-key`, this.rpcSslPrivateKey);
    if (this.rpcSslCertificate != '') options.push(`--rpc-ssl-certificate`, this.rpcSslCertificate);
    if (this.rpcSslCACertificates != '') options.push(`--rpc-ssl-ca-certificates`, this.rpcSslCACertificates);
    if (this.rpcAllowedFingerprints != '') options.push(`--rpc-allowed-fingerprints`, this.rpcAllowedFingerprints);
    if (this.rpcSslAllowChained) options.push(`--rpc-ssl-allow-chained`);
    if (this.rpcSslAllowAnyCert) options.push(`--rpc-ssl-allow-any-cert`);

    if (this.rpcPaymentAddress != '') options.push(`--rpc-payment-address`, this.rpcPaymentAddress);
    if (this.rpcPaymentDifficuly >= 0) options.push(`--rpc-payment-difficulty`, `${this.rpcPaymentDifficuly}`);
    if (this.rpcPaymentCredits >= 0) options.push(`--rpc-payment-credits`, `${this.rpcPaymentCredits}`);
    if (this.rpcPaymentAllowFreeLoopback) options.push(`--rpc-payment-allow-free-loopback`);
    if (this.disableRpcBan) options.push(`--disable-rpc-ban`);

    return options;
  }
}
