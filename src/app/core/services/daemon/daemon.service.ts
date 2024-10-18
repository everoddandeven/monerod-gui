import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { BlockCount } from '../../../../common/BlockCount';
import { firstValueFrom } from 'rxjs';
import { 
  GetBlockCountRequest, GetBlockHashRequest, GetBlockTemplateRequest, JsonRPCRequest, 
  SubmitBlockRequest, GenerateBlocksRequest, GetLastBlockHeaderRequest, 
  GetBlockHeaderByHashRequest, GetBlockHeaderByHeightRequest, GetBlockHeadersRangeRequest, 
  GetConnectionsRequest, GetInfoRequest, HardForkInfoRequest, SetBansRequest, GetBansRequest, 
  BannedRequest, FlushTxPoolRequest, GetOutputHistogramRequest, GetCoinbaseTxSumRequest,
  SyncInfoRequest, GetOutsRequest,
  GetVersionRequest,
  GetFeeEstimateRequest,
  GetAlternateChainsRequest,
  GetTxPoolBacklogRequest,
  PruneBlockchainRequest,
  CalculatePoWHashRequest,
  FlushCacheRequest,
  GetMinerDataRequest,
  EmptyRpcRequest, RPCRequest,
  AddAuxPoWRequest,
  GetOutputDistributionRequest,
  GetBlockRequest,
  UpdateRequest,
  PopBlocksRequest,
  GetTransactionPoolHashesRequest,
  GetTransactionPoolHashesBinaryRequest,
  GetPublicNodesRequest,
  GetNetStatsRequest,
  InPeersRequest,
  OutPeersRequest,
  SetLimitRequest,
  StopDaemonRequest,
  MiningStatusRequest,
  StopMiningRequest,
  StartMiningRequest,
  SendRawTransactionRequest,
  IsKeyImageSpentRequest,
  GetAltBlockHashesRequest,
  SaveBcRequest,
  SetBootstrapDaemonRequest,
  SetLogLevelRequest,
  SetLogHashRateRequest,
  SetLogCategoriesRequest,
  GetTransactionPoolRequest,
  GetPeerListRequest
} from '../../../../common/request';
import { BlockTemplate } from '../../../../common/BlockTemplate';
import { GeneratedBlocks } from '../../../../common/GeneratedBlocks';
import { BlockHeader } from '../../../../common/BlockHeader';
import { Connection } from '../../../../common/Connection';
import { DaemonInfo } from '../../../../common/DaemonInfo';
import { HardForkInfo } from '../../../../common/HardForkInfo';
import { Ban } from '../../../../common/Ban';
import { HistogramEntry } from '../../../../common/HistogramEntry';
import { SyncInfo } from '../../../../common/SyncInfo';
import { DaemonVersion } from '../../../../common/DaemonVersion';
import { FeeEstimate } from '../../../../common/FeeEstimate';
import { Chain } from '../../../../common/Chain';
import { RelayTxRequest } from '../../../../common/request/RelayTxRequest';
import { TxBacklogEntry } from '../../../../common/TxBacklogEntry';
import { BlockchainPruneInfo } from '../../../../common/BlockchainPruneInfo';
import { MinerData } from '../../../../common/MinerData';
import { CoreIsBusyError } from '../../../../common/error';
import { ElectronService } from '../electron/electron.service';
import { AddedAuxPow } from '../../../../common/AddedAuxPow';
import { AuxPoW } from '../../../../common/AuxPoW';
import { OutputDistribution } from '../../../../common/OutputDistribution';
import { CoinbaseTxSum } from '../../../../common/CoinbaseTxSum';
import { Block } from '../../../../common/Block';
import { Output } from '../../../../common/Output';
import { OutKey } from '../../../../common/OutKey';
import { UpdateInfo } from '../../../../common/UpdateInfo';
import { PublicNode } from '../../../../common/PublicNode';
import { NetStats } from '../../../../common/NetStats';
import { MiningStatus } from '../../../../common/MiningStatus';
import { TxInfo } from '../../../../common/TxInfo';
import { DaemonSettings } from '../../../../common/DaemonSettings';
import { MethodNotFoundError } from '../../../../common/error/MethodNotFoundError';
import { openDB, IDBPDatabase } from "idb"
import { PeerInfo, ProcessStats, TxPool } from '../../../../common';
import { MoneroInstallerService } from '../monero-installer/monero-installer.service';

@Injectable({
  providedIn: 'root'
})
export class DaemonService {
  private readonly versionApiUrl: string = 'https://api.github.com/repos/monero-project/monero/releases/latest';
  private dbName = 'DaemonSettingsDB';
  private storeName = 'settingsStore';
  private openDbPromise: Promise<IDBPDatabase>;

  private daemonRunning?: boolean;
  private get url(): string {
    return `http://127.0.0.1:${this.port}`;
  }
  public settings: DaemonSettings;

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
    
    return 38081;
  }

  //private url: string = "http://node2.monerodevs.org:28089";
  //private url: string = "https://testnet.xmr.ditatompel.com";
  //private url: string = "https://xmr.yemekyedim.com:18081";
  //private url: string = "https://moneronode.org:18081";
  public stopping: boolean = false;
  public starting: boolean = false;
  public restarting: boolean = false;
  public disablingSync: boolean = false;
  public enablingSync: boolean = false;
  public startedAt?: Date; 

  public readonly onDaemonStatusChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  public readonly onDaemonStopStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly onDaemonStopEnd: EventEmitter<void> = new EventEmitter<void>();

  private isRunningPromise?: Promise<boolean>;

  private readonly headers: { [key: string]: string } = {
    "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
    "Access-Control-Allow-Methods": 'POST,GET' // this states the allowed methods
  };

  constructor(private installer: MoneroInstallerService, private httpClient: HttpClient, private electronService: ElectronService) {
    this.openDbPromise = this.openDatabase();
    this.settings = new DaemonSettings();

    window.electronAPI.onMoneroClose((event: any, code: number) => {
      console.log(event);
      console.log(code);
      this.onClose();
    });
  }

  public async isWifiConnected(): Promise<boolean> {
    try {
      return new Promise<boolean>((resolve, reject) => {
        try {
          window.electronAPI.onIsWifiConnectedResponse((event: any, connected: boolean) => {
            console.debug(event);
            resolve(connected);
          });

          window.electronAPI.isWifiConnected();
        }
        catch(error: any) {
          reject(error);
        }
      });
    }
    catch(error: any) {
      console.error(error);
    }

    return false;
  }

  public async disableSync(): Promise<void> {
    this.disablingSync = true;

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
    }
    catch(error: any) {
      console.error(error);
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


  private onClose(): void {
    this.daemonRunning = false;
    this.stopping = false;
    this.onDaemonStatusChanged.emit(false);
    this.onDaemonStopEnd.emit();
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

  public async saveSettings(settings: DaemonSettings, restartDaemon: boolean = true): Promise<void> {
    const db = await this.openDbPromise;
    await db.put(this.storeName, { id: 1, ...settings });

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

  public async getSettings(): Promise<DaemonSettings> {
    const db = await this.openDbPromise;
    const result = await db.get(this.storeName, 1);
    if (result) {
      return DaemonSettings.parse(result);
    }
    else
    {
      return new DaemonSettings();
    }
  }

  public async deleteSettings(): Promise<void> {
    const db = await this.openDbPromise;
    await db.delete(this.storeName, 1);
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

  private async get(uri: string): Promise<{[key: string]: any}> {
    return await firstValueFrom<{ [key: string]: any }>(this.httpClient.get(`${uri}`,this.headers));
  }

  private async post(uri: string, params: {[key: string]: any} = {}): Promise<{[key: string]: any}> {
    return await firstValueFrom<{ [key: string]: any }>(this.httpClient.post(`${uri}`, params, this.headers));
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

      const response = await this.post(`${this.url}/${method}`, request.toDictionary());

      if (response.error) {
        this.raiseRpcError(<RpcError>response.error);
      }

      return response;
    }
    catch (error: any) {
      if (error instanceof HttpErrorResponse) {
        if (error.status == 0) {
          const wasRunning = this.daemonRunning;
          this.daemonRunning = false;
  
          if (wasRunning) {
            this.onDaemonStatusChanged.emit(false);
          }
        }

        throw new Error(error.message);
      }

      throw error;
    }
  }

  public async startDaemon(customSettings?: DaemonSettings): Promise<void> {
    if (await this.isRunning()) {
      console.warn("Daemon already running");
      return;
    }

    this.starting = true;

    console.log("Starting daemon");

    this.settings = customSettings ? customSettings : await this.getSettings();
    
    if (!this.settings.noSync && !this.settings.syncOnWifi && await this.isWifiConnected()) {
      console.log("Disabling sync ...");

      this.settings.noSync = true;
    }
    else if (!this.settings.noSync && !this.settings.syncOnWifi && !await this.isWifiConnected()) {
      console.log("Enabling sync ...");

      this.settings.noSync = false;
    }

    const startPromise = new Promise<void>((resolve, reject) => {
      window.electronAPI.onMonerodStarted((event: any, started: boolean) => {
        console.debug(event);
        
        if (started) {
          console.log("Daemon started");
          this.delay(3000).then(() => {
            this.isRunning(true).then((running: boolean) => {
              this.onDaemonStatusChanged.emit(running);
              this.startedAt = new Date();
              this.starting = false;
              resolve();
            }).catch((error: any) => {
              console.error(error);
              this.onDaemonStatusChanged.emit(false);
              this.startedAt = undefined;
              this.starting = false;
              reject(error);
            });
          }).catch((error: any) => {
            this.startedAt = undefined;
            console.error(error);
          });
        }
        else {
          console.log("Daemon not started");
          this.onDaemonStatusChanged.emit(false);
          this.startedAt = undefined;
          this.starting = false;
          reject('Could not start daemon');
        }

      })
    });

    window.electronAPI.startMonerod(this.settings.toCommandOptions());
    
    try {
      await startPromise;
    }
    catch(error: any) {
      console.error(error);
    }
    
    window.electronAPI.unsubscribeOnMonerodStarted();
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
    const block_headers: any[] = response.block_headers;
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

  public async getLatestVersion(): Promise<DaemonVersion> {
    const response = await this.get(this.versionApiUrl);

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

    return new DaemonVersion(0, true, `Monero '${name}' (${response.tag_name}-release)`);
  }

  public async getVersion(dontUseRpc: boolean = false): Promise<DaemonVersion> {
    if(!dontUseRpc && this.daemonRunning) {
      const response = await this.callRpc(new GetVersionRequest());

      return DaemonVersion.parse(response.result);
    }
    else if (dontUseRpc) {
      const monerodPath: string = (await this.getSettings()).monerodPath;
      const wdw = (window as any);

      if (monerodPath == '') {
        throw new Error("Daemon not configured");
      }

      return new Promise<DaemonVersion>((resolve, reject) => {
        if (this.electronService.isElectron) {
          this.electronService.ipcRenderer.on('on-monerod-version', (event, version: string) => {
            resolve(DaemonVersion.parse(version));
          });
          
          this.electronService.ipcRenderer.on('on-monerod-version-error', (event, version: string) => {
            reject(version);
          });
  
          this.electronService.ipcRenderer.send('get-monerod-version', monerodPath);
        }
        else if (wdw.electronAPI && wdw.electronAPI.getMoneroVersion) {
          wdw.electronAPI.onMoneroVersion((event: any, version: string) => {
            resolve(DaemonVersion.parse(version));
          })
          wdw.electronAPI.onMoneroVersionError((event: any, error: string) => {
            reject(error);
          });
          wdw.electronAPI.getMoneroVersion(monerodPath);
        }
      });
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
  }

  public async stopMining(): Promise<void> {
    const response = await this.callRpc(new StopMiningRequest());

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(`Could not stop mining: ${response.status}`);
    }
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

    const response = await this.callRpc(new StopDaemonRequest());
    console.log(response);

    if (typeof response.status == 'string' && response.status != 'OK') {
      throw new Error(`Could not stop daemon: ${response.status}`);
    }

    const maxChecks: number = 100;

    for(let i = 0; i < maxChecks; i++) {
      if (!await this.isRunning(true)) {
        this.stopping = false;
        return;
      } 
      await this.delay(5000);
    }
  
    throw new Error('Could not stop daemon');

    /*
    if (this.electronService.isElectron) {
      return;
    }

    this.daemonRunning = false;
    this.onDaemonStatusChanged.emit(false);
    this.onDaemonStopEnd.emit();
    */
  }

  public async setLimit(limitDown: number, limitUp: number): Promise<{ limitDown: number, limitUp: number }> {
    const response = await this.callRpc(new SetLimitRequest(limitDown, limitUp));

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
    
    return response.in_peers;
  }

  public async outPeers(outPeers: number): Promise<number> {
    const response = await this.callRpc(new OutPeersRequest(outPeers));

    if (typeof response.out_peers != 'number') {
      throw new Error("Could not parse out peers count");
    }

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

      //const downloadUrl = 'https://downloads.getmonero.org/cli/linux64'; // Cambia in base al sistema
      const destination = settings.downloadUpgradePath; // Aggiorna con il percorso desiderato
  
      const moneroFolder = await this.installer.downloadMonero(destination);
      
      settings.monerodPath = `${moneroFolder}/monerod`;

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
    return "0.1.0-alpha";
  }

  public async getProcessStats(): Promise<ProcessStats> {
    if (!await this.isRunning()) {
      throw new Error("Daemon not running");
    }

    const getProcessStatsPromise = new Promise<ProcessStats>((resolve, reject) => {
      window.electronAPI.onMonitorMonerodError((event: any, error: string) => {
        reject(error);
      });

      window.electronAPI.onMonitorMonerod((event: any, stats: ProcessStats) => {
        resolve(stats);
      });
    })

    window.electronAPI.monitorMonerod();

    return await getProcessStatsPromise;
  }

  private _quitting: boolean = false;

  public get quitting(): boolean {
    return this._quitting;
  }

  public async quit(): Promise<void> {
    this._quitting = true;
    const running: boolean = await this.isRunning();

    if (running) {
      await this.stopDaemon();
    }

    window.electronAPI.quit();
  }

}

export interface RpcError { code: number, message: string }