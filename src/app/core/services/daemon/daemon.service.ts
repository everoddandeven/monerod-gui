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
  SetBootstrapDaemonRequest
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
import { resolve } from 'path';

@Injectable({
  providedIn: 'root'
})
export class DaemonService {
  private readonly versionApiUrl: string = 'https://api.github.com/repos/monero-project/monero/releases/latest';
  private dbName = 'DaemonSettingsDB';
  private storeName = 'settingsStore';
  private openDbPromise: Promise<IDBPDatabase>;

  private daemonRunning?: boolean;
  private url: string = "http://127.0.0.1:28081";
  public settings: DaemonSettings;

  //private url: string = "http://node2.monerodevs.org:28089";
  //private url: string = "https://testnet.xmr.ditatompel.com";
  //private url: string = "https://xmr.yemekyedim.com:18081";
  //private url: string = "https://moneronode.org:18081";
  public stopping: boolean = false;
  public starting: boolean = false;
  public readonly onDaemonStatusChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  public readonly onDaemonStopStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly onDaemonStopEnd: EventEmitter<void> = new EventEmitter<void>();

  private isRunningPromise?: Promise<boolean>;

  private readonly headers: { [key: string]: string } = {
    "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
    "Access-Control-Allow-Methods": 'POST,GET' // this states the allowed methods
  };

  constructor(private httpClient: HttpClient, private electronService: ElectronService) {
    this.openDbPromise = this.openDatabase();
    this.settings = this.loadSettings();
    const wdw = (window as any);

    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer.on('monero-close', (event, code: number | null) => {
        this.onClose();
      });
    }
    else if (wdw.electronAPI && wdw.electronAPI.onMoneroClose) {
      wdw.electronAPI.onMoneroClose((event: any, code: number) => {
        this.onClose();
      });
    }
  }

  private onClose(): void {
    this.daemonRunning = false;
    this.stopping = false;
    this.onDaemonStatusChanged.emit(false);
    this.onDaemonStopEnd.emit();
  }

  private async openDatabase(): Promise<IDBPDatabase> {
    return openDB(this.dbName, 1, {
      upgrade(db) {
        // Crea un archivio (store) per i settings se non esiste già
        if (!db.objectStoreNames.contains('settingsStore')) {
          db.createObjectStore('settingsStore', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      },
    });
  }

  public async saveSettings(settings: DaemonSettings): Promise<void> {
    const db = await this.openDbPromise;
    await db.put(this.storeName, { id: 1, ...settings });
    this.settings = settings;
  }

  public async getSettings(): Promise<DaemonSettings> {
    const db = await this.openDbPromise;
    const result = await db.get(this.storeName, 1);
    if (result) {
      this.settings = DaemonSettings.parse(result);
    }
    else
    {
      this.settings = new DaemonSettings();
    }

    return this.settings;
  }

  public async deleteSettings(): Promise<void> {
    const db = await this.openDbPromise;
    await db.delete(this.storeName, 1);
  }

  private loadSettings(): DaemonSettings {
      /*
  const args = [
    '--testnet',
    '--fast-block-sync', '1',
    '--prune-blockchain',
    '--sync-pruned-blocks',
    '--confirm-external-bind',
    '--max-concurrency', '1',
    '--log-level', '1',
    '--rpc-access-control-origins=*'
  ];
  */
    const settings = new DaemonSettings();
    settings.testnet = true;
    settings.fastBlockSync = true;
    settings.pruneBlockchain = true;
    settings.syncPrunedBlocks = true;
    settings.confirmExternalBind = true;
    settings.logLevel = 1;
    settings.rpcAccessControlOrigins = "*";
    return settings;
  }

  private raiseRpcError(error: { code: number, message: string }): void {

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
        this.raiseRpcError(response.error);
      }

      return response;
    }
    catch (error) {
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

  public async startDaemon(): Promise<void> {
    if (await this.isRunning()) {
      console.warn("Daemon already running");
      return;
    }

    this.starting = true;

    console.log("Starting daemon");
    const settings = await this.getSettings();
    
    if (this.electronService.ipcRenderer) this.electronService.ipcRenderer.send('start-monerod', settings.toCommandOptions());
    else {
      (window as any).electronAPI.startMonerod(settings.toCommandOptions());
    }

    await this.delay(3000);

    if (await this.isRunning(true)) {
      console.log("Daemon started");
      this.onDaemonStatusChanged.emit(true);
    }
    else 
    {
      console.log("Daemon not started");
      this.onDaemonStatusChanged.emit(false);
    }

    this.starting = false;

  }

  private async checkDaemonIsRunning(): Promise<boolean> {
    try {
      await this.callRpc(new EmptyRpcRequest());
    }
    catch(error) {
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
      this.raiseRpcError(response.error);
    }

    return Block.parse(response.result);
  }

  public async getBlockCount(): Promise<BlockCount> {
    const response = await this.callRpc(new GetBlockCountRequest());
    
    return BlockCount.parse(response.result);
  }

  public async getBlockHash(blockHeight: number): Promise<string> {
    const response = await this.callRpc(new GetBlockHashRequest(blockHeight));

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

      throw new Error(response.result.status);
    }
  }

  public async generateBlocks(amountOfBlocks: number, walletAddress: string, prevBlock: string = '', startingNonce: number): Promise<GeneratedBlocks> {
    const response = await this.callRpc(new GenerateBlocksRequest(amountOfBlocks, walletAddress, prevBlock, startingNonce));

    if(response.result && response.result.status != 'OK') {
      if (response.result.status == 'BUSY') {
        throw new CoreIsBusyError();
      }

      throw new Error(response.result.status);
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
    const connections: any[] = response.connections;
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
    
    if (response.error) {
      this.raiseRpcError(response.error);
    }

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

    return new Ban(address, 0, result.banned, result.seconds);
  }

  public async flushTxPool(... txIds: string[]): Promise<void> {
    const response = await this.callRpc(new FlushTxPoolRequest(txIds));

    if (response.status != 'OK') {
      throw new Error(`Error code: ${response.status}`);
    }
  }

  public async getOuts(outputs: Output[], getTxId: boolean): Promise<OutKey[]> {
    const response = await this.callRpc(new GetOutsRequest(outputs, getTxId));

    if (response.error) {
      this.raiseRpcError(response.error);
    }

    const _outkeys: any[] | undefined = response.outs;
    const outkeys: OutKey[] = [];

    if (_outkeys) _outkeys.forEach((outkey) => outkeys.push(OutKey.parse(outkey)));

    return outkeys;
  }

  public async getOutputHistogram(amounts: number[], minCount: number, maxCount: number, unlocked: boolean, recentCutoff: number): Promise<HistogramEntry[]> {
    const response = await this.callRpc(new GetOutputHistogramRequest(amounts, minCount, maxCount, unlocked, recentCutoff));

    if (response.error) {
      this.raiseRpcError(response.error);
    }

    const entries: any[] = response.result.histogram;
    const result: HistogramEntry[] = [];

    if (entries) entries.forEach((entry: any) => result.push(HistogramEntry.parse(entry)));

    return result;
  }

  public async getOutputDistribution(amounts: number[], cumulative: boolean, fromHeight: number, toHeight: number): Promise<OutputDistribution[]> {
    const response = await this.callRpc(new GetOutputDistributionRequest(amounts, cumulative, fromHeight, toHeight));

    if (response.error) {
      this.raiseRpcError(response.error);
    }

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
      const monerodPath: string = ''; // TO DO get local monerod path
      const wdw = (window as any);

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
          wdw.electronAPI.getMoneroVersion();
        }
      });
    }

    throw new Error("Daemon not running");
  }

  public async getFeeEstimate(): Promise<FeeEstimate> {
    const response = await this.callRpc(new GetFeeEstimateRequest());

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

    if (response.error) {
      this.raiseRpcError(response.error);
    }

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

    if (!response.bakclog && !response.result) {
      return [];
    }
    
    if (response.backlog) {
      return TxBacklogEntry.fromBinary(response.backlog);
    }
    else if (response.result.backlog) return TxBacklogEntry.fromBinary(response.result.backlog);
    
    return [];
  }

  public async pruneBlockchain(check: boolean = false): Promise<BlockchainPruneInfo> {
    const response = await this.callRpc(new PruneBlockchainRequest(check));

    return BlockchainPruneInfo.parse(response.result);
  }

  public async calculatePoWHash(majorVersion: number, height: number, blockBlob: string, seedHash: string): Promise<string> {
    const response = await this.callRpc(new CalculatePoWHashRequest(majorVersion, height, blockBlob, seedHash));

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

  public async AddAuxPoW(blockTemplateBlob: string, auxPoW: AuxPoW[]): Promise<AddedAuxPow> {
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

    return response.blks_hashes;
  }

  public async isKeyImageSpent(...keyImages: string[]): Promise<number[]> {
    const response = await this.callRpc(new IsKeyImageSpentRequest(keyImages));

    if (response.status != 'OK') {
      throw new Error(response.status);
    }

    return response.spent_status;
  }

  public async sendRawTransaction(txAsHex: string, doNotRelay: boolean = false): Promise<TxInfo> {
    const response = await this.callRpc(new SendRawTransactionRequest(txAsHex, doNotRelay));

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

    return response.in_peers;
  }

  public async outPeers(outPeers: number): Promise<number> {
    const response = await this.callRpc(new OutPeersRequest(outPeers));

    return response.out_peers;
  }

  public async getNetStats(): Promise<NetStats> {
    const response = await this.callRpc(new GetNetStatsRequest());

    return NetStats.parse(response);
  }

  public async getPublicNodes(whites: boolean = true, grays: boolean = false, includeBlocked: boolean = false): Promise<PublicNode[]> {
    const response = await this.callRpc(new GetPublicNodesRequest(whites, grays, includeBlocked));

    const _whites: any[] | undefined = response.whites;
    const _grays: any[] | undefined = response.grays;
    const nodes: PublicNode[] = [];

    if (_whites) _whites.forEach((white) => nodes.push(PublicNode.parse(white, 'white')));
    if (_grays) _grays.forEach((gray) => nodes.push(PublicNode.parse(gray, 'gray')));

    return nodes;
  }

  public async getTransactionPoolHashes(): Promise<string[]> {
    const response = await this.callRpc(new GetTransactionPoolHashesRequest());

    return response.tx_hashes;
  }

  public async getTransactionPoolHashesBinary(): Promise<string> {
    const response = await this.callRpc(new GetTransactionPoolHashesBinaryRequest());

    return response.tx_hashes;
  }

  public async popBlocks(nBlocks: number): Promise<number> {
    const response = await this.callRpc(new PopBlocksRequest(nBlocks));

    return response.height;
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

  public getGuiVersion(): string {
    return "0.1.0-alpha";
  }

}

