export class DaemonInfo {
  
  public readonly adjustedTime: number;
  public readonly altBlocksCount: number;
  public readonly blockSizeLimit: number;
  public readonly blockSizeMedian: number;
  public readonly bootstrapDaemonAddress: string;
  public readonly busySyncing: boolean;
  public readonly credits: number;
  public readonly cumulativeDifficulty: number;
  public readonly cumulativeDifficultyTop64: number;
  public readonly databaseSize: number;
  public readonly difficulty: number;
  public readonly difficultyTop64: number;
  public readonly freeSpace: number;
  public readonly greyPeerlistSize: number;
  public readonly height: number;
  public readonly heightWithoutBootstrap: number;
  public readonly incomingConnectionsCount: number;
  public readonly mainnet: boolean;
  public readonly nettype: string;
  public readonly offline: boolean;
  public readonly outgoingConnectionsCount: number;
  public readonly rpcConnectionsCount: number;
  public readonly stagenet: boolean;
  public readonly startTime: number;
  public readonly status: string;
  public readonly synchronized: boolean;
  public readonly target: number;
  public readonly targetHeight: number;
  public readonly testnet: boolean;
  public readonly topBlockHash: string;
  public readonly topHash: string;
  public readonly txCount: number;
  public readonly txPoolSize: number;
  public readonly untrusted: boolean;
  public readonly updateAvailable: boolean;
  public readonly version: string;
  public readonly wasBoostrapEverUsed: boolean;
  public readonly whitePeerlistSize: number;
  public readonly wideCumulativeDifficulty: string;
  public readonly wideDifficulty: string;

  public get hashRate(): number {
    const target = this.target;

    if (target <= 0) {
      return 0;
    }

    return this.difficulty / this.target;
  }

  public get kiloHashRate(): number {
    return this.hashRate / 1000;
  }

  public get megaHashRate(): number {
    return this.kiloHashRate / 1000;
  }

  public get gigaHashRate(): number {
    return this.hashRate / 1000;
  }
  
  constructor(
      adjustedTime: number,
      altBlocksCount: number,
      blockSizeLimit: number,
      blockSizeMedian: number,
      bootstrapDaemonAddress: string,
      busySyncing: boolean,
      credits: number,
      cumulativeDifficulty: number,
      cumulativeDifficultyTop64: number,
      databaseSize: number,
      difficulty: number,
      difficultyTop64: number,
      freeSpace: number,
      greyPeerlistSize: number,
      height: number,
      heightWithoutBootstrap: number,
      incomingConnectionsCount: number,
      mainnet: boolean,
      nettype: string,
      offline: boolean,
      outgoingConnectionsCount: number,
      rpcConnectionsCount: number,
      stagenet: boolean,
      startTime: number,
      status: string,
      synchronized: boolean,
      target: number,
      targetHeight: number,
      testnet: boolean,
      topBlockHash: string,
      topHash: string,
      txCount: number,
      txPoolSize: number,
      untrusted: boolean,
      updateAvailable: boolean,
      version: string,
      wasBoostrapEverUsed: boolean,
      whitePeerlistSize: number,
      wideCumulativeDifficulty: string,
      wideDifficulty: string
  ) {
    this.adjustedTime = adjustedTime;
    this.altBlocksCount = altBlocksCount;
    this.blockSizeLimit = blockSizeLimit;
    this.blockSizeMedian = blockSizeMedian;
    this.bootstrapDaemonAddress = bootstrapDaemonAddress;
    this.busySyncing = busySyncing;
    this.credits = credits;
    this.cumulativeDifficulty = cumulativeDifficulty;
    this.cumulativeDifficultyTop64 = cumulativeDifficultyTop64;
    this.databaseSize = databaseSize;
    this.difficulty = difficulty;
    this.difficultyTop64 = difficultyTop64;
    this.freeSpace = freeSpace;
    this.greyPeerlistSize = greyPeerlistSize;
    this.height = height;
    this.heightWithoutBootstrap = heightWithoutBootstrap;
    this.incomingConnectionsCount = incomingConnectionsCount;
    this.mainnet = mainnet;
    this.nettype = nettype;
    this.offline = offline;
    this.outgoingConnectionsCount = outgoingConnectionsCount;
    this.rpcConnectionsCount = rpcConnectionsCount;
    this.stagenet = stagenet;
    this.startTime = startTime;
    this.status = status;
    this.synchronized = synchronized;
    this.target = target;
    this.targetHeight = targetHeight;
    this.testnet = testnet;
    this.topBlockHash = topBlockHash;
    this.topHash = topHash;
    this.txCount = txCount;
    this.txPoolSize = txPoolSize;
    this.untrusted = untrusted;
    this.updateAvailable = updateAvailable;
    this.version = version;
    this.wasBoostrapEverUsed = wasBoostrapEverUsed;
    this.whitePeerlistSize = whitePeerlistSize;
    this.wideCumulativeDifficulty = wideCumulativeDifficulty;
    this.wideDifficulty = wideDifficulty;
  }

  public static parse(info: any): DaemonInfo {
    const adjustedTime: number = info.adjusted_time;
    const altBlocksCount: number = info.alt_blocks_count;
    const blockSizeLimit: number = info.block_size_limit;
    const blockSizeMedian: number = info.block_size_median;
    const bootstrapDaemonAddress: string = info.bootstrap_daemon_address;
    const busySyncing: boolean = info.busy_syncing;
    const credits: number = info.credits;
    const cumulativeDifficulty: number = info.cumulative_difficulty;
    const cumulativeDifficultyTop64: number = info.cumulative_difficulty_top64;
    const databaseSize: number = info.database_size;
    const difficulty: number = info.difficulty;
    const difficultyTop64: number = info.difficulty_top64;
    const freeSpace: number = info.free_space;
    const greyPeerlistSize: number = info.grey_peerlist_size;
    const height: number = info.height;
    const heightWithoutBootstrap: number = info.height_without_bootstrap;
    const incomingConnectionsCount: number = info.incoming_connections_count;
    const mainnet: boolean = info.mainnet;
    const nettype: string = info.nettype;
    const offline: boolean = info.offline;
    const outgoingConnectionsCount: number = info.outgoing_connections_count;
    const rpcConnectionsCount: number = info.rpc_connections_count;
    const stagenet: boolean = info.stagenet;
    const startTime: number = info.start_time;
    const status: string = info.status;
    const synchronized: boolean = info.synchronized;
    const target: number = info.target;
    const targetHeight: number = info.target_height;
    const testnet: boolean = info.testnet;
    const topBlockHash: string = info.top_block_hash;
    const topHash: string = info.top_hash;
    const txCount: number = info.tx_count;
    const txPoolSize: number = info.tx_pool_size;
    const untrusted: boolean = info.untrusted;
    const updateAvailable: boolean = info.update_available;
    const version: string = info.version;
    const wasBoostrapEverUsed: boolean = info.was_boostrap_ever_used === true ? true : false;
    const whitePeerlistSize: number = info.white_peerlist_size;
    const wideCumulativeDifficulty: string = info.wide_cumulative_difficulty;
    const wideDifficulty: string = info.wide_difficulty;

    return new DaemonInfo(
        adjustedTime, altBlocksCount, blockSizeLimit, blockSizeMedian,
        bootstrapDaemonAddress, busySyncing, credits, cumulativeDifficulty,
        cumulativeDifficultyTop64, databaseSize, difficulty,
        difficultyTop64, freeSpace, greyPeerlistSize,
        height, heightWithoutBootstrap, incomingConnectionsCount, mainnet,
        nettype, offline, outgoingConnectionsCount, rpcConnectionsCount,
        stagenet, startTime, status, synchronized, target, targetHeight,
        testnet, topBlockHash, topHash, txCount, txPoolSize, untrusted,
        updateAvailable, version, wasBoostrapEverUsed, whitePeerlistSize,
        wideCumulativeDifficulty, wideDifficulty
    );
  }
}
