import { EventEmitter, inject, Injectable } from '@angular/core';
import { MiningStatus, P2PoolSettings } from '../../../../common';
import { IDBPDatabase, openDB } from 'idb';
import { ElectronService } from '../electron/electron.service';

type Status = 'running' | 'stopped' | 'starting' | 'restarting' | 'stopping';
type Pool = 'main' | 'mini';

export class P2PoolMinerStats {
  public currentHashrate: number = 0;
  public totalHashes: number = 0;
  public timeRunning: number = 0;
  public sharesFound: number = 0;
  public sharesFailed: number = 0;
  public blockRewardSharePercent: number = 0;
  public threads: number = 0;

  public get KHashrate(): number {
    return parseFloat(`${(this.currentHashrate / 1024).toFixed(2)}`);
  }

  public get MHashrate(): number {
    return parseFloat(`${(this.KHashrate / 1024).toFixed(2)}`);
  }

  public get GHashrate(): number {
    return parseFloat(`${(this.MHashrate / 1024).toFixed(2)}`);
  }

  public static parse(s: any): P2PoolMinerStats {
    const r = new P2PoolMinerStats();

    r.currentHashrate = s.current_hashrate as number;
    r.totalHashes = s.total_hashes as number;
    r.timeRunning = s.time_running as number;
    r.sharesFound = s.shares_found as number;
    r.sharesFailed = s.shares_failed as number;
    r.blockRewardSharePercent = s.block_reward_share_percent as number;
    r.threads = s.threads as number;

    return r;
  }
}

export class P2PoolStats {
  public poolList: string[] = [];
  public hashrate: number = 0;
  public miners: number = 0;
  public totalHashes: number = 0;
  public lastBlockFoundTime: number = 0;
  public lastBlockFound = 0;
  public totalBlocksFound: number = 0;
  public sidechainDifficulty: number = 0;
  public sidechainHeight: number = 0;
  public pplnsWeight: number = 0;
  public pplnsWindowSize: number = 0;

  public get KHashrate(): number {
    return parseFloat(`${(this.hashrate / 1024).toFixed(2)}`);
  }

  public get MHashrate(): number {
    return parseFloat(`${(this.KHashrate / 1024).toFixed(2)}`);
  }

  public get GHashrate(): number {
    return parseFloat(`${(this.MHashrate / 1024).toFixed(2)}`);
  }

  public static parse(s: any): P2PoolStats {
    const stats = new P2PoolStats();

    stats.poolList = s.pool_list as string[];
    
    const { pool_statistics } = s;

    if (pool_statistics) {
      stats.hashrate = pool_statistics.hashRate as number;
      stats.miners = pool_statistics.miners as number;
      stats.totalHashes = pool_statistics.totalHashes as number;
      stats.lastBlockFoundTime = pool_statistics.lastBlockFoundTime as number;
      stats.lastBlockFound = pool_statistics.lastBlockFound as number;
      stats.sidechainDifficulty = pool_statistics.sidechainDifficulty as number;
      stats.sidechainHeight = pool_statistics.sidechainHeight as number;
      stats.totalBlocksFound = pool_statistics.totalBlocksFound as number;
      stats.pplnsWeight = pool_statistics.pplnsWeight as number;
      stats.pplnsWindowSize = pool_statistics.pplnsWindowSize as number;
    }

    return stats;
  }

}

export class P2PoolStratum {
  public hashrate15m: number = 0;
  public hashrate1h: number = 0;
  public hashrate24h: number = 0;
  public totalHashes: number = 0;
  public totalStratumShares: number = 0;
  public lastShareFoundTime: number = 0;
  public sharesFound: number = 0;
  public sharesFailed: number = 0;
  public averageEffort: number = 0;
  public currentEffort: number = 0;
  public connections: number = 0;
  public incomingConnections: number = 0;
  public blockRewardSharePercent: number = 0;

  public static parse(s: any): P2PoolStratum {
    const r = new P2PoolStratum();

    r.hashrate15m = s.hashrate_15m as number;
    r.hashrate1h = s.hashrate_1h as number;
    r.hashrate24h = s.hashrate_24h as number;
    r.totalHashes = s.total_hashes as number;
    r.totalStratumShares = s.total_stratum_shares as number;
    r.lastShareFoundTime = s.last_share_found_time as number;
    r.sharesFound = s.shares_found as number;
    r.sharesFailed = s.shares_failed as number;
    r.averageEffort = s.average_effort as number;
    r.currentEffort = s.current_effort as number;
    r.connections = s.connections as number;
    r.incomingConnections = s.incoming_connections as number;
    r.blockRewardSharePercent = s.block_reward_share_percent as number;

    return r;
  }

}

export class P2PoolNetworkStats {
  public difficulty: number = 0;
  public hash: string = '';
  public height: number = 0;
  public reward: number = 0;
  public timestamp: number = 0;

  public static parse(s: any): P2PoolNetworkStats {
    const r = new P2PoolNetworkStats();

    r.difficulty = s.difficulty as number;
    r.hash = s.hash as string;
    r.height = s.height as number;
    r.reward = s.reward as number;
    r.timestamp = s.timestamp as number;

    return r;
  }
}

@Injectable({
  providedIn: 'root'
})
export class P2poolService {

  // #region Attributes

  private readonly electronService: ElectronService = inject(ElectronService);

  private readonly openDbPromise: Promise<IDBPDatabase>;
  private readonly dbName = 'P2PoolSettingsDB';
  private readonly storeName = 'settingsStore';

  public readonly std: P2PoolStd = { out: new EventEmitter<string>(), err: new EventEmitter<string>() };

  private _status: Status = 'stopped';
  private _pool: Pool = 'main';
  private _settings: P2PoolSettings = new P2PoolSettings();
  private _loaded: boolean = false;
  private _logs: string[] = [];
  public readonly onStart: EventEmitter<void> = new EventEmitter<void>();
  public readonly onStop: EventEmitter<void> = new EventEmitter<void>();

  // Cached data

  public updatingData: boolean = false;
  public miningStatus?: MiningStatus;
  public minerStats?: P2PoolMinerStats;
  public poolStats?: P2PoolStats;
  public stratum?: P2PoolStratum;
  public networkStat?: P2PoolNetworkStats;


  // #endregion

  // #region Getters

  public get status(): Status {
    return this._status;
  }

  public get running(): boolean {
    return this._status === 'running';
  }

  public get stopped(): boolean {
    return this._status === 'stopped';
  }

  public get starting(): boolean {
    return this._status === 'starting';
  }

  public get restarting(): boolean {
    return this._status === 'restarting';
  }

  public get stopping(): boolean {
    return this._status === 'stopping';
  }

  public get pool(): Pool {
    return this._pool;
  }

  public get settings(): P2PoolSettings {
    return this._settings;
  }

  private get separator(): '\\' | '/' {
    const separator: '\\' | '/' = this.apiFolder.includes('\\') ? '\\' : '/';
    return separator;
  }

  private get apiFolder(): string {
    return this.settings.getDataApi();
  }

  private get apiMinerPath(): string {
    const s = this.separator;
    return `${this.apiFolder}${s}local${s}miner`;
  }

  private get apiPoolPath(): string {
    const s = this.separator;
    return `${this.apiFolder}${s}pool${s}stats`;
  }

  private get apiStratumPath(): string {
    const s = this.separator;
    return `${this.apiFolder}${s}local${s}stratum`;
  }

  private get apiNetworkPath(): string {
    const s = this.separator;
    return `${this.apiFolder}${s}network${s}stats`;
  }

  // #endregion

  constructor() {
    this.openDbPromise = this.openDatabase();
    this.loadSettings().then(() => console.log('Loaded p2pool settings database')).catch((error: any) => console.error(error));
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

  public setSettings(config: P2PoolSettings): void {
    this._settings = config;
  }

  public setPool(pool: Pool): void {
    this._pool = pool;
  }

  public async getMinerStats(): Promise<P2PoolMinerStats> {
    const content = await this.electronService.readFile(this.apiMinerPath);
    const jsonObj = JSON.parse(content);
    return P2PoolMinerStats.parse(jsonObj);
  }

  public async getPoolStats(): Promise<P2PoolStats> {
    const content = await this.electronService.readFile(this.apiPoolPath);
    const jsonObj = JSON.parse(content);
    return P2PoolStats.parse(jsonObj);
  }

  public async getStratum(): Promise<P2PoolStratum> {
    const content = await this.electronService.readFile(this.apiStratumPath);
    const jsonObj = JSON.parse(content);
    return P2PoolStratum.parse(jsonObj);
  }

  public async getNetworkStats(): Promise<P2PoolNetworkStats> {
    const content = await this.electronService.readFile(this.apiNetworkPath);
    const jsonObj = JSON.parse(content);
    return P2PoolNetworkStats.parse(jsonObj);
  }

  public async loadSettings(): Promise<P2PoolSettings> {
    const db = await this.openDbPromise;
    const result = await db.get(this.storeName, 1);
    
    if (result) {
      this.setSettings(P2PoolSettings.parse(result));
    }
    else
    {
      this.setSettings(new P2PoolSettings());
    }

    this._loaded = true;

    return this._settings;
  }

  public async start(config?: P2PoolSettings): Promise<void> {
    const _config = config ? config : this._settings;
    if (_config.path === '') throw new Error("P2Pool not configured. Go to Settings -> Mining");
    if (this.running) throw new Error("Already running p2pool");
    if (this.stopping) throw new Error("p2pool is stopping");
    if (this.starting) throw new Error("Alrady starting p2pool");
    let err: any = null;
    this._status = 'starting';

    try {
      const dataApi = _config.getDataApi();
      await this.electronService.createFolder(dataApi);

      const promise = new Promise<void>((resolve, reject) => {
        
        window.electronAPI.onP2PoolOutput(({stdout, stderr} : { stdout?: string, stderr?: string }) => {
          if (stdout) {
            this._logs.push(stdout);
            this.std.out.emit(stdout);
          } else if (stderr) {
            this._logs.push(stderr);
            this.std.err.emit(stderr);
            //this._status = 'stopped';
          }
        });

        window.electronAPI.onP2PoolClose((code: number) => {
          console.log(code);
          this._status = 'stopped';
          this.onStop.emit();
        });

        window.electronAPI.startP2Pool(_config.toCommandOptions(), (error?: any) => {
          this._status = error ? 'stopped' : 'running';
          if (error) reject(new Error(`${error}`));
          else resolve();
        });
      });

      await promise;

      this.setSettings(_config);
      this._status = 'running';
      this.onStart.emit();
    } catch (error: any) {
      console.error(error);
      err = error;
      this._status = 'stopped';
    }

    if (err) throw err;
  }
  
  public async stop(): Promise<void> {
    if (this.starting) throw new Error("p2pool is starting");
    if (!this.running) throw new Error("Already stopped p2pool");
    if (this.stopping) throw new Error("Alrady stopping p2pool");
    this._status = 'stopping';
    let err: any = null;

    try {
      const promise = new Promise<void>((resolve, reject) => {
        window.electronAPI.stopP2Pool((error?: any) => {
          this._status = 'stopped';
          if (error) reject(new Error(`${error}`));
          else resolve();
        });
      });
    
      console.log("STOPPING P2POOL...");
      
      await promise;
      this.minerStats = undefined;
      this.miningStatus = undefined;
      this.poolStats = undefined;
      this.stratum = undefined;
      this.networkStat = undefined;
      this._status = 'stopped';
      console.log("STOPPED P2Pool...");
    }
    catch (error: any) {
      err = error;
      this._status = 'running';
    }
    
    if (!this.restarting) this.onStop.emit();

    if (err) throw err;
  }

  public async restart(): Promise<void> {
    if (this.restarting) throw new Error("Already restarting p2pool");
    if (this.starting) throw new Error("p2pool is starting");
    if (this.stopping) throw new Error("p2pool is stopping");
    if (!this.running) throw new Error("p2pool is not running");

    this._status = 'restarting';
    let err: any = null;

    try {
      await this.stop();
      await this.start();
    }
    catch(error: any) {
      err = error;
    }

    this._status = 'running';

    if (err) throw err;
  }

  public async isValidPath(path: string): Promise<boolean> {
    return await new Promise<boolean>((resolve) => {
      window.electronAPI.checkValidP2PoolPath(path, resolve);
    });
  }

  public async saveSettings(): Promise<void> {
    const db = await this.openDbPromise;
    const settings = this.settings;
    await db.put(this.storeName, { id: 1, ...settings });
  }

  public async setPath(path: string, save: boolean = false, restart: boolean = false): Promise<void> {
    if (!await this.isValidPath(path)) throw new Error("Invalid p2pool path: " + path);

    this._settings.path = path;

    if (save) 
    {
      await this.saveSettings();
    }

    if (this.running && restart) {
      await this.restart();
    }
  }

  public clearLogs(): void {
    this._logs = [];
  }

  public async getMiningStatus(): Promise<MiningStatus> {
    const stats = await this.getMinerStats();
    const net = this.networkStat ? this.networkStat : new P2PoolNetworkStats();
    return new MiningStatus(this.running, this.settings.wallet, 0, 0, 0, net.reward, 120, net.difficulty, 0, false, 'RandomX', stats.currentHashrate, stats.threads, 'unknown');
  }

  public async updateData(): Promise<void> {
    let err: any = null;
    
    try {
      if (this.updatingData) throw new Error("Already updating data");
      this.updatingData = true;

      this.networkStat = await this.getNetworkStats();
      this.miningStatus = await this.getMiningStatus();
      this.minerStats = await this.getMinerStats();
      this.poolStats = await this.getPoolStats();

    } catch (error: any) {
      console.error(error);
      err = error;
    }

    this.updatingData = false;
    if (err) throw err;
  }

}

export interface P2PoolStd {
  readonly out: EventEmitter<string>;
  readonly err: EventEmitter<string>;
};