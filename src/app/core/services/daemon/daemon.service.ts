import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BlockCount } from '../../../../common/BlockCount';
import { firstValueFrom } from 'rxjs';
import { 
  GetBlockCountRequest, GetBlockHashRequest, GetBlockTemplateRequest, JsonRPCRequest, 
  SubmitBlockRequest, GenerateBlocksRequest, GetLastBlockHeaderRequest, 
  GetBlockHeaderByHashRequest, GetBlockHeaderByHeightRequest, GetBlockHeadersRangeRequest, 
  GetConnectionsRequest, GetInfoRequest, HardForkInfoRequest, SetBansRequest, GetBansRequest, 
  BannedRequest, FlushTxPoolRequest, GetOutputHistogramRequest, 
  SyncInfoRequest,
  GetVersionRequest,
  GetFeeEstimateRequest,
  GetAlternateChainsRequest,
  GetTxPoolBacklogRequest,
  PruneBlockchainRequest,
  CalculatePoWHashRequest,
  FlushCacheRequest,
  GetMinerDataRequest
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

@Injectable({
  providedIn: 'root'
})
export class DaemonService {
  private url: string = "http://127.0.0.1:28081";
  
  private readonly headers: { [key: string]: string } = {
    'Content-Type': 'application/json'
  };

  constructor(private httpClient: HttpClient) { }

  private async callJsonRpc(params: JsonRPCRequest): Promise<{ [key: string]: any }> {
    return await firstValueFrom<{ [key: string]: any }>(this.httpClient.post(`${this.url}/json_rpc`, params.toDictionary(), this.headers));
  }

  public async getBlockCount(): Promise<BlockCount> {
    const response = await this.callJsonRpc(new GetBlockCountRequest());
    
    return BlockCount.parse(response.result);
  }

  public async getBlockHash(blockHeight: number): Promise<string> {
    const response = await this.callJsonRpc(new GetBlockHashRequest(blockHeight));

    return response.result;
  }

  public async getBlockTemplate(walletAddress: string, reserveSize: number) {
    const response = await this.callJsonRpc(new GetBlockTemplateRequest(walletAddress, reserveSize));

    return BlockTemplate.parse(response.result);
  }

  public async submitBlock(... blockBlobData: string[]): Promise<void> {
    const response = await this.callJsonRpc(new SubmitBlockRequest(blockBlobData));

    if (response.error) {
      if (!response.message) {
        throw new Error(`Error code: ${response.code}`);
      }

      throw new Error(response.message);
    }
  }

  public async generateBlocks(amountOfBlocks: number, walletAddress: string, prevBlock: string = '', startingNonce: number): Promise<GeneratedBlocks> {
    const response = await this.callJsonRpc(new GenerateBlocksRequest(amountOfBlocks, walletAddress, prevBlock, startingNonce));

    return GeneratedBlocks.parse(response.result);
  }

  public async getLastBlockHeader(fillPowHash: boolean = false): Promise<BlockHeader> {
    const response = await this.callJsonRpc(new GetLastBlockHeaderRequest(fillPowHash));

    return BlockHeader.parse(response.block_header);
  }

  public async getBlockHeaderByHash(hash: string, fillPowHash: boolean = false): Promise<BlockHeader> {
    const response = await this.callJsonRpc(new GetBlockHeaderByHashRequest(hash, fillPowHash));

    return BlockHeader.parse(response.block_header);
  }

  public async getBlockHeaderByHeight(height: number, fillPowHash: boolean = false): Promise<BlockHeader> {
    const response = await this.callJsonRpc(new GetBlockHeaderByHeightRequest(height, fillPowHash));

    return BlockHeader.parse(response.block_header);
  }

  public async getBlockHeadersRange(startHeight: number, endHeight: number, fillPowHash: boolean = false): Promise<BlockHeader[]> {
    const response = await this.callJsonRpc(new GetBlockHeadersRangeRequest(startHeight, endHeight, fillPowHash));
    const block_headers: any[] = response.block_headers;
    const result: BlockHeader[] = [];

    block_headers.forEach((block_header: any) => result.push(BlockHeader.parse(block_header)));

    return result;
  }

  public async getConnections(): Promise<Connection[]> {
    const response = await this.callJsonRpc(new GetConnectionsRequest());
    const connections: any[] = response.connections;
    const result: Connection[] = [];

    connections.forEach((connection: any) => result.push(Connection.parse(connection)))

    return result;
  }

  public async getInfo(): Promise<DaemonInfo> {
    const response = await this.callJsonRpc(new GetInfoRequest());
    
    return DaemonInfo.parse(response.result);
  }

  public async hardForkInfo(): Promise<HardForkInfo> {
    const response = await this.callJsonRpc(new HardForkInfoRequest());

    return HardForkInfo.parse(response.result);
  }

  public async setBans(...bans: Ban[]) {
    const response = await this.callJsonRpc(new SetBansRequest(bans));

    if (response.status != 'OK') {
      throw new Error(`Error code: ${response.status}`);
    }
  }

  public async getBans(): Promise<Ban[]> {
    const response = await this.callJsonRpc(new GetBansRequest());
    const bans: any[] = response.bans;
    const result: Ban[] = [];

    bans.forEach((ban: any) => result.push(Ban.parse(ban)));

    return result;
  }

  public async banned(address: string): Promise<Ban> {
    const response = await this.callJsonRpc(new BannedRequest(address));
    const result = response.result;

    if (result.status != 'OK') {
      throw new Error(`Error code: ${result.response}`);
    }

    return new Ban(address, 0, result.banned, result.seconds);
  }

  public async flushTxPool(... txIds: string[]): Promise<void> {
    const response = await this.callJsonRpc(new FlushTxPoolRequest(txIds));

    if (response.status != 'OK') {
      throw new Error(`Error code: ${response.status}`);
    }
  }

  public async getOutputHistogram(amounts: number[], minCount: number, maxCount: number, unlocked: boolean, recentCutoff: number): Promise<HistogramEntry[]> {
    const response = await this.callJsonRpc(new GetOutputHistogramRequest(amounts, minCount, maxCount, unlocked, recentCutoff));
    const entries: any[] = response.histogram;
    const result: HistogramEntry[] = [];

    entries.forEach((entry: any) => result.push(HistogramEntry.parse(entry)));

    return result;
  }

  public async syncInfo(): Promise<SyncInfo> {
    const response = await this.callJsonRpc(new SyncInfoRequest());

    return SyncInfo.parse(response.result);
  }

  public async getVersion(): Promise<DaemonVersion> {
    const response = await this.callJsonRpc(new GetVersionRequest());

    return DaemonVersion.parse(response.result);
  }

  public async getFeeEstimate(): Promise<FeeEstimate> {
    const response = await this.callJsonRpc(new GetFeeEstimateRequest());

    return FeeEstimate.parse(response.result);
  }

  public async getAlternateChains(): Promise<Chain[]> {
    const response = await this.callJsonRpc(new GetAlternateChainsRequest());
    const chains: any[] = response.result.chains ? response.result.chains : [];
    const result: Chain[] = [];

    chains.forEach((chain: any) => result.push(Chain.parse(chain)));

    return result;
  }

  public async relayTx(... txIds: string[]): Promise<void> {
    const response = await this.callJsonRpc(new RelayTxRequest(txIds));

    if (response.result.status != 'OK') {
      throw new Error(`Error code: ${response.result.status}`);
    }
  }

  public async getTxPoolBacklog(): Promise<TxBacklogEntry[]> {
    const response = await this.callJsonRpc(new GetTxPoolBacklogRequest());

    return TxBacklogEntry.fromBinary(response.backlog);
  }

  public async pruneBlockchain(check: boolean = false): Promise<BlockchainPruneInfo> {
    const response = await this.callJsonRpc(new PruneBlockchainRequest(check));

    return BlockchainPruneInfo.parse(response.result);
  }

  public async calculatePoWHash(majorVersion: number, height: number, blockBlob: string, seedHash: string): Promise<string> {
    const response = await this.callJsonRpc(new CalculatePoWHashRequest(majorVersion, height, blockBlob, seedHash));

    return response.result;
  }

  public async flushCache(badTxs: boolean = false, badBlocks: boolean = false): Promise<void> {
    const response = await this.callJsonRpc(new FlushCacheRequest(badTxs, badBlocks));

    if(response.result.status != 'OK') {
      throw new Error(`Error code: ${response.result.status}`);
    }
  }

  public async getMinerData(): Promise<MinerData> {
    const response = await this.callJsonRpc(new GetMinerDataRequest());

    return MinerData.parse(response.result);
  }

}

