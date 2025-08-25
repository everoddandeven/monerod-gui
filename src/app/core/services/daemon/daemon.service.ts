import { HttpErrorResponse } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { 
  GetBlockCountRequest, GetBlockHashRequest, GetBlockTemplateRequest, JsonRPCRequest, 
  SubmitBlockRequest, GenerateBlocksRequest, GetLastBlockHeaderRequest, 
  GetBlockHeaderByHashRequest, GetBlockHeaderByHeightRequest, GetBlockHeadersRangeRequest, 
  GetConnectionsRequest, GetInfoRequest, HardForkInfoRequest, SetBansRequest, GetBansRequest, 
  BannedRequest, FlushTxPoolRequest, GetOutputHistogramRequest, GetCoinbaseTxSumRequest,
  SyncInfoRequest, GetOutsRequest, GetVersionRequest, GetFeeEstimateRequest,
  GetAlternateChainsRequest, GetTxPoolBacklogRequest, PruneBlockchainRequest,
  CalculatePoWHashRequest, FlushCacheRequest, GetMinerDataRequest, EmptyRpcRequest, RPCRequest,
  AddAuxPoWRequest, GetOutputDistributionRequest, GetBlockRequest, UpdateRequest,
  PopBlocksRequest, GetTransactionPoolHashesRequest, GetTransactionPoolHashesBinaryRequest,
  GetPublicNodesRequest, GetNetStatsRequest, InPeersRequest, OutPeersRequest,
  SetLimitRequest, StopDaemonRequest, MiningStatusRequest, StopMiningRequest,
  StartMiningRequest, SendRawTransactionRequest, IsKeyImageSpentRequest,
  GetAltBlockHashesRequest, SaveBcRequest, SetBootstrapDaemonRequest, MethodNotFoundError,
  SetLogLevelRequest, SetLogHashRateRequest, SetLogCategoriesRequest, DaemonSettings,
  GetTransactionPoolRequest, GetPeerListRequest, GetTransactionPoolStatsRequest, MiningStatus,
  BlockTemplate, GeneratedBlocks, BlockHeader, Connection, DaemonInfo, HardForkInfo,
  Ban, HistogramEntry, SyncInfo, DaemonVersion, FeeEstimate, Chain, AddedAuxPow, TxInfo,
  RelayTxRequest, TxBacklogEntry, BlockchainPruneInfo, MinerData, CoreIsBusyError, NetStats,
  AuxPoW, OutputDistribution, CoinbaseTxSum, Block, Output, OutKey, UpdateInfo, PublicNode,
  PeerInfo, ProcessStats, TimeUtils, TxPool, TxPoolStats, BlockCount,
  GetTransactionsRequest,
  Transaction
} from '../../../../common';

import { MoneroInstallerService } from '../monero-installer/monero-installer.service';
import { ElectronService } from '../electron/electron.service';
import { openDB, IDBPDatabase } from "idb"
import { I2pDaemonService } from '../i2p/i2p-daemon.service';
import { TorDaemonService } from '../tor/tor-daemon.service';
import { P2poolService } from '../p2pool/p2pool.service';
import { XmrigService } from '../xmrig/xmrig.service';

@Injectable({
  providedIn: 'root'
})
export class DaemonService {

  // #region Attributes

  private readonly installer = inject(MoneroInstallerService);
  private readonly electronService = inject(ElectronService);
  private readonly i2pService = inject(I2pDaemonService);
  private readonly torService = inject(TorDaemonService);
  private readonly p2poolService = inject(P2poolService);
  private readonly xmrigService = inject(XmrigService);

  private readonly versionApiUrl: string = 'https://api.github.com/repos/monero-project/monero/releases/latest';
  private dbName = 'DaemonSettingsDB';
  private storeName = 'settingsStore';
  
  private openDbPromise: Promise<IDBPDatabase>;
  private daemonRunning?: boolean;
  private isRunningPromise?: Promise<boolean>;
  private _quitting: boolean = false;
  private _miningStartedAt: number = 0;

  private mLatestVersion?: DaemonVersion;
  public version?: DaemonVersion;

  public stopping: boolean = false;
  public starting: boolean = false;
  public restarting: boolean = false;
  public disablingSync: boolean = false;
  public enablingSync: boolean = false;
  public startedAt?: Date;
  public startHeight: number = 0;

  public settings: DaemonSettings;
  private _firstRun: boolean = true;

  // #region Events

  public readonly onDaemonStatusChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  public readonly onDaemonStopStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly onDaemonStopEnd: EventEmitter<void> = new EventEmitter<void>();
  public readonly onSavedSettings: EventEmitter<DaemonSettings> = new EventEmitter<DaemonSettings>();

  // #endregion

  // #endregion

  // #region Getters

  public get miningStartedAt(): number {
    return this._miningStartedAt;
  }

  public get url(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  private _limits?: { 
    peers: { in: number, out: number },
    bandwidth: { in: number, out: number }
  };

  public get quitting(): boolean {
    return this._quitting;
  }

  public get limits(): { 
    peers: { in: number, out: number },
    bandwidth: { in: number, out: number }
  } {
    if (this._limits) return this._limits;

    const settings = this.settings;

    const { inPeers, outPeers, limitRate, limitRateUp, limitRateDown } = settings;
    let inBand = 0, outBand = 0;

    if (limitRate != -1) inBand = outBand = limitRate;
    else {
      inBand = limitRateUp;
      outBand = limitRateDown;
    }

    this._limits = {
      peers: { in: inPeers, out: outPeers },
      bandwidth: { in: inBand, out: outBand }
    };

    return this._limits;
  }

  private get port(): number {
    if (this.settings.rpcBindPort > 0) {
      return this.settings.rpcBindPort;
    }
    else if (this.settings.mainnet) {
      return 18081;
    }
    else if (this.settings.testnet) {
      return 28081;
    }
    else if (this.settings.privnet) {
      return 48081;
    }
    
    return 38081;
  }

  public get startingI2pService(): boolean {
    return this.i2pService.starting;
  }

  public get stoppingI2pService(): boolean {
    return this.i2pService.stopping;
  }

  public get startingTorService(): boolean {
    return this.torService.starting;
  }

  public get stoppingTorService(): boolean {
    return this.i2pService.stopping;
  }

  // #endregion

  constructor() {
    this.openDbPromise = this.openDatabase();
    this.settings = new DaemonSettings();

    window.electronAPI.onMonerodClose((code: number) => {
      if (code != 0) {
        window.electronAPI.showNotification({
          title: 'Daemon Error',
          body: 'Monero daemon exited with code: ' + code,
          closeButtonText: 'Dismiss'
        });
      }
      this.onClose();
    });

  }

  // #region Private Methods

  private onClose(): void {
    this.stopping = true;
    const handler = () => {
      this.daemonRunning = false;
      this.starting = false;
      this.stopping = false;
      this.onDaemonStatusChanged.emit(false);
      this.onDaemonStopEnd.emit();
    };
    const promises = [];
    
    if (this.xmrigService.running && !this.xmrigService.stopping) {
      promises.push(this.xmrigService.stop());
    }

    if (this.i2pService.running && !this.i2pService.stopping) {
      promises.push(this.i2pService.stop());
    }

    if (this.torService.running && !this.torService.stopping) {
      promises.push(this.torService.stop());
    }

    if (this.p2poolService.running && !this.p2poolService.stopping) {
      promises.push(this.p2poolService.stop());
    }

    Promise.all(promises).catch((error: any) => console.error(error)).finally(handler);
  }

  private async openDatabase(): Promise<IDBPDatabase<any>> {
    return await openDB<any>(this.dbName, 1, {
      upgrade(db) {
        // Crea un archivio (store) per i settings se non esiste già
        if (!db.objectStoreNames.contains('settingsStore')) {
          db.createObjectStore('settingsStore', {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      },
    });
  }

  private raiseRpcError(error: RpcError): void {
    if (error.code == -9) {
      throw new CoreIsBusyError();
    }
    else if (error.code == -32601) {
      throw new MethodNotFoundError();
    }
    else 
    {
      throw new Error(error.message);
    }
  }

  private async delay(ms: number = 0): Promise<void> {
    await new Promise<void>(f => setTimeout(f, ms));
  }

  private getLogin(): { 'username': string; 'password': string; } | undefined {
    if (this.settings.rpcLogin != '') {
      try {
        const components = this.settings.rpcLogin.split(":");

        if (components.length == 2) {
          return {
            'username': components[0],
            'password': components[1]
          }
        }
      }
      catch {
        return undefined;
      }
    }

    return undefined;
  }

  private async callRpc(request: RPCRequest): Promise<{ [key: string]: any }> {
    try {
      let method: string = '';

      if (request instanceof JsonRPCRequest) {
        method = 'json_rpc';
      }
      else {
        method = request.method;
      }

      const response = await this.electronService.post(`${this.url}/${method}`, request.toDictionary());

      if (response.error) {
        this.raiseRpcError(<RpcError>response.error);
      }

      return response;
    }
    catch (error: any) {
      if (error instanceof HttpErrorResponse) {
        const errorMessage: string = error.status == 0 ? `No connection` : `${error.message}`;

        throw new Error(errorMessage);
      }

      throw error;
    }
  }

  private async checkDaemonIsRunning(): Promise<boolean> {
    try {
      await this.callRpc(new EmptyRpcRequest());
    }
    catch(error: any) {
      if (error instanceof MethodNotFoundError) {
        return true;
      }

      console.error(error);
    }

    return false;
  }

  // #endregion

  // #region Public Methods

  public async disableSync(): Promise<void> {
    this.disablingSync = true;

    window.electronAPI.showNotification({
      title: 'Disabling sync',
      body: 'Node sync is about to be disabled',
      closeButtonText: 'Dismiss'
    });

    try {
      const running: boolean = await this.isRunning();

      if (!running) {
        throw new Error("Daemon not running");
      }

      if (this.settings.noSync) {
        throw new Error("Daemon already not syncing");
      }
  
      await this.stopDaemon();

      this.settings.noSync = true;

      await this.startDaemon(this.settings);

      window.electronAPI.showNotification({
        title: 'Sync disabled',
        body: 'Node sync disabled successfully',
        closeButtonText: 'Dismiss'
      });
      
    }
    catch(error: any) {
      console.error(error);
      window.electronAPI.showNotification({
        title: 'Error',
        body: 'An error occurred while disabling sync',
        closeButtonText: 'Dimiss'
      })
    }

    this.disablingSync = false;
  }

  public async enableSync(): Promise<void> {
    this.enablingSync = true;

    try {
      const running: boolean = await this.isRunning();

      if (!running) {
        throw new Error("Daemon not running");
      }

      if (!this.settings.noSync) {
        throw new Error("Daemon already not syncing");
      }
  
      await this.stopDaemon();

      this.settings.noSync = false;

      await this.startDaemon(this.settings);
    }
    catch(error: any) {
      console.error(error);
    }

    this.enablingSync = false;
  }

  public async saveSettings(settings: DaemonSettings, restartDaemon: boolean = true): Promise<void> {
    settings.assertValid();

    if (settings.monerodPath != '') {
      const valid = await this.checkValidMonerodPath(settings.monerodPath);

      if (!valid) {
        throw new Error("Invalid monerod path provided");
      }
    }

    this.version = undefined;

    const db = await this.openDbPromise;
    await db.put(this.storeName, { id: 1, ...settings });
    
    this.onSavedSettings.emit(settings);

    if (restartDaemon) {
      const running = await this.isRunning();

      if (!running) {
        return;
      }
      
      try {
        await this.restartDaemon();
      } 
      catch(error: any) {
        console.error(error);
      }
    }
  }

  public async checkValidMonerodPath(path: string): Promise<boolean> {
    if (path == null || path == undefined || path.replace(' ', '') == '') {
      return false;
    }

    const checkPromise = new Promise<boolean>((resolve) => {
      window.electronAPI.checkValidMonerodPath(path, (valid: boolean) => {
        resolve(valid);
      });
    });

    return await checkPromise;
  }

  public async checkValidI2pdPath(path: string): Promise<boolean> {
    if (path == null || path == undefined || path.replace(' ', '') == '') {
      return false;
    }

    const checkPromise = new Promise<boolean>((resolve) => {
      window.electronAPI.checkValidI2pdPath(path, resolve);
    });

    return await checkPromise;
  }

  public async loadSettings(): Promise<void> {
    this.settings = await this.getSettings(true, false);
  }

  public async getSettings(checkValidPath: boolean = true, checkIsRunning: boolean = true): Promise<DaemonSettings> {
    console.log(`DaemonService.getSettings(${checkValidPath}, ${checkIsRunning})`);
    const db = await this.openDbPromise;
    const result = await db.get(this.storeName, 1);
    if (result) {
      console.log('daemon settings loaded:', result);
      const settings = DaemonSettings.parse(result);
      if (this._firstRun) {
        this.settings = settings;
        console.log("OVERRIDED DAEMON SETTINGS")
        this._firstRun = false;
      }
      const running = checkIsRunning ? await this.isRunning() : false;

      if (!running && checkValidPath && settings.monerodPath != '' && !await this.checkValidMonerodPath(settings.monerodPath)) {
        settings.monerodPath = '';
      }
      
      const enabled = await this.electronService.isAutoLaunchEnabled();

      settings.startAtLogin = enabled;
     
      if (!enabled) {
        settings.startAtLoginMinimized = false;
      }

      return settings;
    }
    else
    {
      console.warn("Daemon settings database not found");
      return new DaemonSettings();
    }
  }

  public async deleteSettings(): Promise<void> {
    const db = await this.openDbPromise;
    await db.delete(this.storeName, 1);
  }

  public async startDaemon(customSettings?: DaemonSettings): Promise<void> {
    if (await this.isRunning()) {
      console.warn("Daemon already running");
      return;
    }

    this.version = undefined;

    this.starting = true;
    this.startHeight = 0;

    console.log("Starting daemon");

    if (!this.restarting && !this.enablingSync) {
      window.electronAPI.showNotification({
        title: 'Daemon starting',
        body: 'Monero daemon is starting',
        closeButtonText: 'Dismiss'
      });
    }

    this.settings = customSettings ? customSettings : await this.getSettings();
    
    if (!this.settings.noSync && !this.settings.syncOnWifi && await this.electronService.isWifiConnected()) {
      console.log("Disabling sync ...");
      this.settings.noSync = true;
    }
    else if (!this.settings.noSync && this.settings.syncPeriodEnabled && !TimeUtils.isInTimeRange(this.settings.syncPeriodFrom, this.settings.syncPeriodTo)) {
      console.log("Disabling sync ...");
      this.settings.noSync = true;
    }

    if (this.torService.settings.enabled) {
      console.log('starting tor service');
      this.torService.settings.port = 1 + this.settings.getPort();
      this.torService.settings.rpcPort = this.settings.getRpcPort();

      if (!this.torService.running) try {
        await this.torService.start();
        console.log('started tor service');

        this.settings.padTransactions = true;
  
        if (this.torService.settings.txProxyEnabled) {
          this.settings.setTxProxy(this.torService.txProxy, 'tor');
        }
        if (this.torService.settings.allowIncomingConnections) {
          const anonInbound = await this.torService.getAnonymousInbound();
          this.settings.setAnonymousInbound(anonInbound, 'tor');
        }
        if (this.torService.settings.proxyAllNetConnections) {
          this.settings.proxy = this.torService.proxy;
        }
      }
      catch (error: any) {
        console.error(error);
        if (this.torService.running) await this.torService.stop();
        window.electronAPI.showNotification({
          title: 'Daemon error',
          body: error instanceof Error ? error.message : `${error}`,
          closeButtonText: 'Dismiss'
        });
        this.starting = false;
        throw error;
      }
    }

    if (this.i2pService.settings.enabled) {
      if (this.i2pService.running) throw new Error("I2P Service should not be running");
      
      console.log('starting i2pd service');
      this.i2pService.settings.port = this.settings.getPort();
      this.i2pService.settings.rpcPort = this.settings.getRpcPort();
      if (this.i2pService.settings.torAsOutproxy && this.torService.settings.enabled && this.torService.running) {
        this.i2pService.settings.outproxy = { host: '127.0.0.1', port: 9050 };
      }

      try {
        await this.i2pService.start();
        console.log('started i2pd service');

        this.settings.padTransactions = true;
  
        if (this.i2pService.settings.txProxyEnabled) {
          this.settings.setTxProxy(this.i2pService.txProxy, 'i2p');
        }
        if (this.i2pService.settings.allowIncomingConnections) {
          const anonInbound = await this.i2pService.getAnonymousInbound();
          this.settings.setAnonymousInbound(anonInbound, 'i2p');
        }
      }
      catch (error: any) {
        if (this.torService.running) await this.torService.stop();
        if (this.i2pService.running) await this.i2pService.forceShutdown();
        console.error(error);
        window.electronAPI.showNotification({
          title: 'Daemon error',
          body: error instanceof Error ? error.message : `${error}`,
          closeButtonText: 'Dismiss'
        });
        this.starting = false;
        throw error;
      }
    }

    const startPromise = new Promise<void>((resolve, reject) => {
      window.electronAPI.startMonerod(this.settings.toCommandOptions(), (result: {error?: any}) => {
        const { error } = result;
        const started = error === undefined || error === null;

        if (started) {
          console.log("monerod started");
          this.delay(3000).then(() => {
            this.isRunning(true).then((running: boolean) => {
              window.electronAPI.showNotification({
                title: this.enablingSync ? 'Enabled blockchain sync' : this.restarting ? 'Daemon restarted' : 'Daemon started',
                body: this.enablingSync ? 'Successfully enabled node blockchain sync' : this.restarting ? 'Successfully restarted daemon' : 'Successfully started daemon',
                closeButtonText: 'Dismiss'
              });
              this.onDaemonStatusChanged.emit(running);
              this.startedAt = new Date();
              this.starting = false;
              resolve();
            }).catch((error: any) => {
              console.error(error);
              window.electronAPI.showNotification({
                title: 'Daemon error',
                body: 'An error occurred while checking daemon status',
                closeButtonText: 'Dismiss'
              });
              this.onDaemonStatusChanged.emit(false);
              this.startedAt = undefined;
              this.starting = false;
              reject(new Error(`${error}`));
            });
          }).catch((error: any) => {
            this.startedAt = undefined;
            console.error(error);
            this.starting = false;
          });
        }
        else if (error) {
          const body = this.enablingSync ? 'Could not enable node blockchain sync' : this.restarting ? 'Could not restart monerod' : 'Could not start monerod';

          console.log("Daemon not started");
          window.electronAPI.showNotification({
            title: 'Daemon Error',
            body
          });
          this.onDaemonStatusChanged.emit(false);
          this.startedAt = undefined;
          this.starting = false;
          
          const err = error instanceof Error ? error.message : `${error}`;
          reject(new Error('Could not start daemon: ' + err));
        }

      })
    });
    
    await startPromise;    
  }

  public async restartDaemon(): Promise<void> {
    this.restarting = true;
    let err: any = undefined;
    try {
      const running = await this.isRunning();

      if (!running) {
        await this.startDaemon();
      }
      else {
        await this.stopDaemon();
        await this.startDaemon();
      }
    }
    catch(error: any) {
      console.error(error);
      err = error;
    }

    this.restarting = false;

    if (err) {
      throw err;
    }
  }

  public async isRunning(force: boolean = false): Promise<boolean> {
    if (this.isRunningPromise) {
      return await this.isRunningPromise;
    }
    
    if (!force && this.daemonRunning != undefined) {
      return this.daemonRunning;
    }

    this.isRunningPromise = this.checkDaemonIsRunning();

    this.daemonRunning = await this.isRunningPromise;
    
    this.isRunningPromise = undefined;

    return this.daemonRunning;
  }

  public async getBlock(heightOrHash: number | string, fillPowHash: boolean = false): Promise<Block> {
    const response = await this.callRpc(new GetBlockRequest(heightOrHash, fillPowHash));

    if (response.error) {
      this.raiseRpcError(<RpcError>response.error);
    }

    return Block.parse(response.result);
  }

  public async getBlockCount(): Promise<BlockCount> {
    const response = await this.callRpc(new GetBlockCountRequest());
    
    return BlockCount.parse(response.result);
  }

  public async getBlockHash(blockHeight: number): Promise<string> {
    const response = await this.callRpc(new GetBlockHashRequest(blockHeight));

    if (typeof response.result != 'string') {
      throw new Error("Could not parse block hash");
    }

    return response.result;
  }

  public async getBlockTemplate(walletAddress: string, reserveSize: number) {
    const response = await this.callRpc(new GetBlockTemplateRequest(walletAddress, reserveSize));

    return BlockTemplate.parse(response.result);
  }

  public async submitBlock(... blockBlobData: string[]): Promise<void> {
    const response = await this.callRpc(new SubmitBlockRequest(blockBlobData));

    if (response.result && typeof response.result.status == 'string' && response.result.status != 'OK') {
      if (response.result.status == 'BUSY') {
        throw new CoreIsBusyError();
      }

      throw new Error(<string>response.result.status);
    }
  }

  public async generateBlocks(amountOfBlocks: number, walletAddress: string, prevBlock: string = '', startingNonce: number): Promise<GeneratedBlocks> {
    const response = await this.callRpc(new GenerateBlocksRequest(amountOfBlocks, walletAddress, prevBlock, startingNonce));

    if(response.result && typeof response.result.status == 'string' && response.result.status != 'OK') {
      if (response.result.status == 'BUSY') {
        throw new CoreIsBusyError();
      }

      throw new Error(<string>response.result.status);
    }

    return GeneratedBlocks.parse(response.result);
  }

  public async getLastBlockHeader(fillPowHash: boolean = false): Promise<BlockHeader> {
    const response = await this.callRpc(new GetLastBlockHeaderRequest(fillPowHash));

    if (response.result && response.result.status == 'BUSY') {
      throw new CoreIsBusyError();
    }

    return BlockHeader.parse(response.result.block_header);
  }

  public async getBlockHeaderByHash(hash: string, fillPowHash: boolean = false): Promise<BlockHeader> {
    const response = await this.callRpc(new GetBlockHeaderByHashRequest(hash, fillPowHash));

    return BlockHeader.parse(response.result.block_header);
  }

  public async getBlockHeaderByHeight(height: number, fillPowHash: boolean = false): Promise<BlockHeader> {
    const response = await this.callRpc(new GetBlockHeaderByHeightRequest(height, fillPowHash));

    return BlockHeader.parse(response.result.block_header);
  }

  public async getBlockHeadersRange(startHeight: number, endHeight: number, fillPowHash: boolean = false): Promise<BlockHeader[]> {
    const response = await this.callRpc(new GetBlockHeadersRangeRequest(startHeight, endHeight, fillPowHash));
    const block_headers: any[] = response.result?.headers ? response.result.headers : [];
    const result: BlockHeader[] = [];

    block_headers.forEach((block_header: any) => result.push(BlockHeader.parse(block_header)));

    return result;
  }

  public async getConnections(): Promise<Connection[]> {
    const response = await this.callRpc(new GetConnectionsRequest());

    if (!response.result || !response.result.connections) {
      return [];
    }

    const connections: any[] = response.result.connections;
    const result: Connection[] = [];

    connections.forEach((connection: any) => result.push(Connection.parse(connection)))

    return result;
  }

  public async getInfo(): Promise<DaemonInfo> {
    const response = await this.callRpc(new GetInfoRequest());
    
    return DaemonInfo.parse(response.result);
  }

  public async hardForkInfo(): Promise<HardForkInfo> {
    const response = await this.callRpc(new HardForkInfoRequest());

    return HardForkInfo.parse(response.result);
  }

  public async setBans(...bans: Ban[]) {
    const response = await this.callRpc(new SetBansRequest(bans));

    if (response.status != 'OK') {
      throw new Error(`Error code: ${response.status}`);
    }
  }

  public async getBans(): Promise<Ban[]> {
    const response = await this.callRpc(new GetBansRequest());

    if (!response.result) {
      return [];
    }

    const bans: any[] = response.result.bans;
    const result: Ban[] = [];

    if (bans) bans.forEach((ban: any) => result.push(Ban.parse(ban)));

    return result;
  }

  public async banned(address: string): Promise<Ban> {
    const response = await this.callRpc(new BannedRequest(address));
    const result = response.result;

    if (result.status != 'OK') {
      throw new Error(`Error code: ${result.response}`);
    }

    const banned: boolean = result.banned;
    const seconds: number = result.seconds;

    return new Ban(address, 0, banned, seconds);
  }

  public async flushTxPool(... txIds: string[]): Promise<void> {
    const response = await this.callRpc(new FlushTxPoolRequest(txIds));

    if (response.status != 'OK') {
      throw new Error(`Error code: ${response.status}`);
    }
  }

  public async getOuts(outputs: Output[], getTxId: boolean): Promise<OutKey[]> {
    const response = await this.callRpc(new GetOutsRequest(outputs, getTxId));

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(response.status);
    }

    const _outkeys: any[] | undefined = response.outs;
    const outkeys: OutKey[] = [];

    if (_outkeys) _outkeys.forEach((outkey) => outkeys.push(OutKey.parse(outkey)));

    return outkeys;
  }

  public async getOutputHistogram(amounts: number[], minCount: number, maxCount: number, unlocked: boolean, recentCutoff: number): Promise<HistogramEntry[]> {
    const response = await this.callRpc(new GetOutputHistogramRequest(amounts, minCount, maxCount, unlocked, recentCutoff));

    const entries: any[] = response.result.histogram;
    const result: HistogramEntry[] = [];

    if (entries) entries.forEach((entry: any) => result.push(HistogramEntry.parse(entry)));

    return result;
  }

  public async getOutputDistribution(amounts: number[], cumulative: boolean, fromHeight: number, toHeight: number): Promise<OutputDistribution[]> {
    const response = await this.callRpc(new GetOutputDistributionRequest(amounts, cumulative, fromHeight, toHeight));

    const entries: any[] = response.result.distributions;
    const distributions: OutputDistribution[] = [];

    if (entries) entries.forEach((entry) => distributions.push(OutputDistribution.parse(entry)));

    return distributions;
  }

  public async syncInfo(): Promise<SyncInfo> {
    const response = await this.callRpc(new SyncInfoRequest());

    return SyncInfo.parse(response.result);
  }

  public async getLatestVersion(force: boolean = false): Promise<DaemonVersion> {
    if (!force && this.mLatestVersion) {
      return this.mLatestVersion;
    }
    
    const response = await this.electronService.get(this.versionApiUrl);

    if (typeof response.tag_name != 'string') {
      throw new Error("Could not get tag name version");
    }

    if (typeof response.name != 'string') {
      throw new Error("Could not get name version");
    }

    const nameComponents = response.name.split(",");

    if (nameComponents.length == 0) {
      throw new Error("Could not get name");
    }

    const name = nameComponents[0];

    this.mLatestVersion = new DaemonVersion(0, true, `Monero '${name}' (${response.tag_name}-release)`);

    return this.mLatestVersion;
  }

  public async getVersion(dontUseRpc: boolean = false): Promise<DaemonVersion> {
    if(!dontUseRpc && this.daemonRunning) {
      const response = await this.callRpc(new GetVersionRequest());

      return DaemonVersion.parse(response.result);
    }
    else if (this.version) return this.version;
    else if (dontUseRpc) {
      const monerodPath: string = (await this.getSettings()).monerodPath;

      if (monerodPath == '') {
        throw new Error("Daemon not configured");
      }

      const promise = new Promise<DaemonVersion>((resolve, reject) => {
        window.electronAPI.getMonerodVersion(monerodPath, (result: { version?: string; error?: string; }) => {
          if (result.version) resolve(DaemonVersion.parse(result.version));
          else if (result.error) reject(new Error(result.error));
          else reject(new Error("No result found"));
        });

      });

      this.version = await promise;

      return this.version;
    }

    throw new Error("Daemon not running");
  }

  public async getFeeEstimate(graceBlocks: number = 0): Promise<FeeEstimate> {
    const response = await this.callRpc(new GetFeeEstimateRequest(graceBlocks));

    return FeeEstimate.parse(response.result);
  }

  public async getAlternateChains(): Promise<Chain[]> {
    const response = await this.callRpc(new GetAlternateChainsRequest());
    const chains: any[] = response.result.chains ? response.result.chains : [];
    const result: Chain[] = [];

    chains.forEach((chain: any) => result.push(Chain.parse(chain)));

    return result;
  }

  public async getCoinbaseTxSum(height: number, count: number): Promise<CoinbaseTxSum> {
    const response = await this.callRpc(new GetCoinbaseTxSumRequest(height, count));

    return CoinbaseTxSum.parse(response.result);
  }

  public async relayTx(... txIds: string[]): Promise<void> {
    const response = await this.callRpc(new RelayTxRequest(txIds));

    if (response.result.status != 'OK') {
      throw new Error(`Error code: ${response.result.status}`);
    }
  }

  public async getTxPoolBacklog(): Promise<TxBacklogEntry[]> {
    const response = await this.callRpc(new GetTxPoolBacklogRequest());

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(`Error code: ${response.status}`)
    }

    if (!response.backlog && !response.result) {
      return [];
    }
    
    if (response.backlog && typeof response.backlog == 'string') {
      return TxBacklogEntry.fromBinary(response.backlog);
    }
    else if (response.result.backlog && typeof response.result.backlog == 'string') return TxBacklogEntry.fromBinary(<string>response.result.backlog);
    
    return [];
  }

  public async pruneBlockchain(check: boolean = false): Promise<BlockchainPruneInfo> {
    const response = await this.callRpc(new PruneBlockchainRequest(check));

    return BlockchainPruneInfo.parse(response.result);
  }

  public async calculatePoWHash(majorVersion: number, height: number, blockBlob: string, seedHash: string): Promise<string> {
    const response = await this.callRpc(new CalculatePoWHashRequest(majorVersion, height, blockBlob, seedHash));

    if (typeof response.result != 'string') {
      throw new Error("Unexpected result type")
    }

    return response.result;
  }

  public async flushCache(badTxs: boolean = false, badBlocks: boolean = false): Promise<void> {
    const response = await this.callRpc(new FlushCacheRequest(badTxs, badBlocks));

    if(response.result.status != 'OK') {
      throw new Error(`Error code: ${response.result.status}`);
    }
  }

  public async getMinerData(): Promise<MinerData> {
    const response = await this.callRpc(new GetMinerDataRequest());

    return MinerData.parse(response.result);
  }

  public async addAuxPoW(blockTemplateBlob: string, auxPoW: AuxPoW[]): Promise<AddedAuxPow> {
    const response = await this.callRpc(new AddAuxPoWRequest(blockTemplateBlob, auxPoW));

    return AddedAuxPow.parse(response.result);
  }

  public async setBootstrapDaemon(address: string, username: string = '', password: string = '', proxy: string = ''): Promise<void> {
    const response = await this.callRpc(new SetBootstrapDaemonRequest(address, username, password, proxy));

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(`Could not set bootstrap daemon: ${response.status}`);
    }
  }

  public async removeBootstrapDaemon(): Promise<void> {
    const response = await this.callRpc(new SetBootstrapDaemonRequest('', '', '', ''));

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(`Could not remove bootstrap daemon: ${response.status}`);
    }
  }

  public async saveBc(): Promise<void> {
    const response = await this.callRpc(new SaveBcRequest());

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(`Could not save blockchain: ${response.status}`);
    }
  }

  public async getAltBlockHashes(): Promise<string[]> {
    const response = await this.callRpc(new GetAltBlockHashesRequest());
    const altBlockHashes: string[] = response.blks_hashes;

    if (!Array.isArray(altBlockHashes)) {
      return [];
    }

    altBlockHashes.forEach((blockHash: string) => {
      if(typeof blockHash != 'string') {
        throw new Error("Could not parse alt block hashes");
      }
    })

    return altBlockHashes;
  }

  public async isKeyImageSpent(...keyImages: string[]): Promise<number[]> {
    const response = await this.callRpc(new IsKeyImageSpentRequest(keyImages));

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(response.status);
    }

    const spentStatus: number[] = response.spent_status;

    if (!Array.isArray(spentStatus)) {
      throw new Error("Could not parse spent list result");
    }

    return spentStatus;
  }

  public async sendRawTransaction(txAsHex: string, doNotRelay: boolean = false): Promise<TxInfo> {
    const response = await this.callRpc(new SendRawTransactionRequest(txAsHex, doNotRelay));

    if (typeof response.status == 'string' && response.status != 'OK') {
      if (typeof response.reason == 'string')
      {
        throw new Error(response.reason);
      }
      else {
        throw new Error(response.status);
      }
    }

    return TxInfo.parse(response);
  }

  public async startMining(doBackgroundMining: boolean, ignoreBattery: boolean, minerAddress: string, threadsCount: number): Promise<void> {
    const response = await this.callRpc(new StartMiningRequest(doBackgroundMining, ignoreBattery, minerAddress, threadsCount));
    
    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(`Could not start mining: ${response.status}`);
    }

    this._miningStartedAt = Date.now();
  }

  public async stopMining(): Promise<void> {
    const response = await this.callRpc(new StopMiningRequest());

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(`Could not stop mining: ${response.status}`);
    }

    this._miningStartedAt = 0;
  }

  public async miningStatus(): Promise<MiningStatus> {
    const response = await this.callRpc(new MiningStatusRequest());

    return MiningStatus.parse(response);
  }

  public async stopDaemon(): Promise<void> {
    if (!this.daemonRunning) {
      console.warn("Daemon not running");
      return;
    }
    if (this.stopping) {
      console.warn("Daemon already stopping");
      return;
    }
    if (this.starting) {
      console.warn("Daemon is starting");
      return;
    }

    this.stopping = true;
    this.onDaemonStopStart.emit();
    
    window.electronAPI.showNotification({
      title: this.quitting ? 'Quiting monero daemon' : this.restarting ? 'Restarting monero daemon' : 'Stopping monero daemon',
      body: this.quitting ? 'Monero daemon is quiting' : this.restarting ? 'Monero daemon is restarting' : 'Monero daemon is stopping'
    });
    
    if (this.p2poolService.running) {
      console.log("Stopping p2pool service");

      await this.p2poolService.stop();

      console.log("Stopped p2pool service");
    }

    if (this.settings.privnet) {
      await new Promise<void>((resolve, reject) => {
        window.electronAPI.stopMonerod(({ error }: { error?: string; code?: number; }) => {
          if (error) reject(new Error(error));
          else resolve();
        });
      });
      return;
    }

    const response = await this.callRpc(new StopDaemonRequest());

    if (typeof response.status == 'string' && response.status != 'OK') {
      window.electronAPI.showNotification({
        title: 'Error',
        body: 'Could not stop daemon'
      });
      throw new Error(`Could not stop daemon: ${response.status}`);
    }

    const maxChecks: number = 100;

    for(let i = 0; i < maxChecks; i++) {
      if (!await this.isRunning(true)) {
        
        if (this.i2pService.running) {
          console.log('stopping i2pd service');
          await this.i2pService.stop();
          console.log('stopped i2pd service');
        }

        if (this.torService.running) {
          console.log("Stopping tor service");

          await this.torService.stop();

          console.log("Stopped tor service");
        }

        this.stopping = false;

        if (!this.restarting) {
          if (!this.quitting) {
        
            window.electronAPI.showNotification({
              title: 'Daemon stopped',
              body: 'Successfully stopped monero daemon'
            });
          }
          else {
            window.electronAPI.showNotification({
              title: 'Daemon quitted',
              body: 'Successfully quit monero daemon'
            });
          }
        }
        
        return;
      }
       
      await this.delay(5000);
    }

    window.electronAPI.showNotification({
      title: 'Error',
      body: 'Could not stop daemon'
    });

    throw new Error('Could not stop daemon');
  }

  public async setLimit(limitDown: number, limitUp: number): Promise<{ limitDown: number, limitUp: number }> {
    const response = await this.callRpc(new SetLimitRequest(limitDown, limitUp));

    this.limits.bandwidth.in = limitDown;
    this.limits.bandwidth.out = limitUp;

    return {
      limitDown: response.limit_down,
      limitUp: response.limit_up
    };
  }

  public async inPeers(inPeers: number): Promise<number> {
    const response = await this.callRpc(new InPeersRequest(inPeers));
    
    if (typeof response.in_peers != 'number') {
      throw new Error("Could not parse in peers count");
    }
    
    this.limits.peers.in = inPeers;

    return response.in_peers;
  }

  public async outPeers(outPeers: number): Promise<number> {
    const response = await this.callRpc(new OutPeersRequest(outPeers));

    if (typeof response.out_peers != 'number') {
      throw new Error("Could not parse out peers count");
    }

    this.limits.peers.out = outPeers;

    return response.out_peers;
  }

  public async getNetStats(): Promise<NetStats> {
    const response = await this.callRpc(new GetNetStatsRequest());

    return NetStats.parse(response);
  }

  public async getPeerList(): Promise<PeerInfo[]> {
    const response = await this.callRpc(new GetPeerListRequest());

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(response.status);
    }

    const peerList: PeerInfo[] = [];
    const whiteList: any[] | undefined = response.white_list
    const grayList: any[] | undefined = response.gray_list;

    if (whiteList) whiteList.forEach((white: any) => peerList.push(PeerInfo.parse(white, 'white')));
    if (grayList) grayList.forEach((gray: any) => peerList.push(PeerInfo.parse(gray, 'gray')));

    return peerList;
  }

  public async getPublicNodes(whites: boolean = true, grays: boolean = false, includeBlocked: boolean = false): Promise<PublicNode[]> {
    const response = await this.callRpc(new GetPublicNodesRequest(whites, grays, includeBlocked));

    const _whites: any[] | undefined = response.white;
    const _grays: any[] | undefined = response.gray;
    const nodes: PublicNode[] = [];

    if (_whites) _whites.forEach((white) => nodes.push(PublicNode.parse(white, 'white')));
    if (_grays) _grays.forEach((gray) => nodes.push(PublicNode.parse(gray, 'gray')));

    return nodes;
  }

  public async getTransactionPool(): Promise<TxPool> {
    const response = await this.callRpc(new GetTransactionPoolRequest());

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(response.status);
    }

    return TxPool.parse(response);
  }

  public async getTransactionPoolStats(): Promise<TxPoolStats> {
    const response = await this.callRpc(new GetTransactionPoolStatsRequest());

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(response.status);
    }

    return TxPoolStats.parse(response.pool_stats);
  }

  public async getTransactionPoolHashes(): Promise<string[]> {
    const response = await this.callRpc(new GetTransactionPoolHashesRequest());
    const txHashes: string[] = response.tx_hashes;

    if (!Array.isArray(txHashes)) {
      throw new Error("Could not parse txHashses");
    }

    return txHashes;
  }

  public async getTransactionPoolHashesBinary(): Promise<string> {
    const response = await this.callRpc(new GetTransactionPoolHashesBinaryRequest());

    if (typeof response.tx_hashes != 'string') {
      throw new Error("Could not parse binary");
    }

    return response.tx_hashes;
  }

  public async getTransactions(...hashes: string[]): Promise<any> {
    const response = await this.callRpc(new GetTransactionsRequest(hashes, true, false, false));
    const missedTxs = response.missed_tx as string[];
    
    if (Array.isArray(missedTxs) && missedTxs.length > 0) throw new Error(`Could not find txs: ${missedTxs.join(' ')}`);

    return Transaction.parseRpcResponse(response);
  }

  public async popBlocks(nBlocks: number): Promise<number> {
    const response = await this.callRpc(new PopBlocksRequest(nBlocks));

    if (typeof response.height != 'number') {
      throw new Error("");
    }

    return response.height;
  }

  public async upgrade(): Promise<void> {
    const settings = await this.getSettings();
      if (settings.upgradeAutomatically) {
        throw new Error('Monero Daemon will upgrade automatically');
      }
      if (settings.downloadUpgradePath == '') {
        throw new Error("Download path not configured");
      }

      const destination = settings.downloadUpgradePath; // Aggiorna con il percorso desiderato  
      const moneroFolder = await this.installer.downloadMonero(destination, settings.monerodPath != '');
      const { platform } = await this.electronService.getOsType();
      const isWin32 = platform == 'win32';

      const ext = isWin32 ? '.exe' : '';
      const separator = isWin32 ? '\\' : '/';
      
      settings.monerodPath = `${moneroFolder}${separator}monerod${ext}`;

      await this.saveSettings(settings);
  }

  public async update(command: 'check' | 'download', path: string = ''): Promise<UpdateInfo> {
    const response = await this.callRpc(new UpdateRequest(command, path));
    
    return UpdateInfo.parse(response);
  }

  public async checkUpdate(): Promise<UpdateInfo> {
    return await this.update('check');
  }

  public async downloadUpdate(path: string = ''): Promise<UpdateInfo> {
    return await this.update('download', path);
  }

  public async setLogLevel(level: number): Promise<void> {
    const response = await this.callRpc(new SetLogLevelRequest(level));

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(response.status);
    }
  }

  public async setLogCategories(cateogories: string): Promise<void> {
    const response = await this.callRpc(new SetLogCategoriesRequest(cateogories));

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(response.status);
    }
  }

  public async setLogHashRate(visible: boolean): Promise<void> {
    const response = await this.callRpc(new SetLogHashRateRequest(visible));

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(response.status);
    }
  }

  public getGuiVersion(): string {
    return "1.3.0-main";
  }

  public async getProcessStats(): Promise<ProcessStats> {
    if (!await this.isRunning()) {
      throw new Error("Daemon not running");
    }

    const getProcessStatsPromise = new Promise<ProcessStats>((resolve, reject) => {
      window.electronAPI.monitorProcess('monerod', (result) => {
        const { error, stats } = result;

        if (error) {
          if (error instanceof Error) reject(error);
          else reject(new Error(`${error}`));
        }
        else if (stats) {
          resolve(stats);
        }
      });
    })


    return await getProcessStatsPromise;
  }

  public async detectInstallation(): Promise<{ path: string; } | undefined> {
    return await new Promise<{ path: string; } | undefined>((resolve) => {
      window.electronAPI.detectInstallation('monerod', resolve);
    });
  }

  public async quit(): Promise<void> {
    if (this._quitting) throw new Error("Already quitting daemon");
    
    this._quitting = true;

    await new Promise<void>((resolve, reject) => {
      window.electronAPI.quit((error?: string) => {
        if (error) reject(new Error(error));
        else resolve();
      });
    });

    this._quitting = false;
  }

  public getNetworkType(): 'mainnet' | 'testnet' | 'stagenet' {
    const { mainnet, stagenet } = this.settings;
    return mainnet ? 'mainnet' : stagenet ? 'stagenet' : 'testnet';
  }

  // endregion

}

export interface RpcError { code: number, message: string }