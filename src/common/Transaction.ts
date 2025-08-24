

export class Transaction {
  public hash: string = '';
  public blockHeight?: number;
  public blockTimestamp?: number;
  public confirmations: number = 0;
  public inPool: boolean = false;
  public outputIndices: number[] = [];
  public doubleSpend: boolean = false;
  public unlockTime: number = 0;
  public version: number = 0;
  public fee: number = 0;

  public get feeXMR(): string {
    return `${(this.fee / 1e12).toFixed(12)}`;
  }

  public get blockTimestampMs(): number {
    if (!this.blockTimestamp) return 0;
    return this.blockTimestamp * 1000;
  }

  public keyImages: string[] = [];

  public get hashShort(): string {
    if (!this.hash) return '';
    return `${this.hash.slice(0, 4)}...${this.hash.slice(-4)}`;
  }

  public static parse(i: any): Transaction {
    const r = new Transaction();

    r.blockHeight = i.block_height as number;
    r.blockTimestamp = i.block_timestamp as number;
    r.confirmations = i.confirmations;
    r.inPool = i.in_pool as boolean;
    r.outputIndices = i.output_indices as number[];
    r.hash = i.tx_hash as string;
    r.doubleSpend = i.double_spend_seen as boolean;

    const j = JSON.parse(i.as_json as string);

    r.version = j.version as number;
    r.unlockTime = j.unlock_time as number;

    const vin = j.vin as any[];

    vin.forEach((v) => {
      if (!v.key) return;
      const { k_image } = v.key;
      if (!k_image) return;
      r.keyImages.push(k_image as string);
    });

    const rctSig = j.rct_signatures;

    if (rctSig && rctSig.txnFee) r.fee = rctSig.txnFee; 

    return r;
  }

  public static parseMultiple(i: any[]): Transaction[] {
    const r: Transaction[] = [];

    i.forEach((j) => r.push(Transaction.parse(j)));

    return r;
  }

  public static parseRpcResponse(r: any): Transaction[] {
    return Transaction.parseMultiple(r.txs ? r.txs : []);
  }

}