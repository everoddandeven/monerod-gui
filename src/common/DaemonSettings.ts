export class DaemonSettings {
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
    public mainnet: boolean = false;
    public stagenet: boolean = false;

    public regtest: boolean = false;
    
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

    public toCommandOptions(): string {
        let options: string = '';

        return options;
    }
}
