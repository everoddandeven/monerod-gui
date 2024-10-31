export class TxPoolStats {
  public readonly bytesMax: number;
  public readonly bytesMed: number;
  public readonly bytesMin: number;
  public readonly bytesTotal: number;

  public readonly feeTotal: number;
  
  public readonly histo: TxPoolHisto;
  public readonly histo98pc: number;
  
  public readonly num10m: number;
  public readonly numDoubleSpends: number;
  public readonly numFailing: number;
  public readonly numNotRelayed: number;
  public readonly oldest: number;
  public readonly txsTotal: number;

  public get feeTotalXMR(): number {
    return this.feeTotal / 1e12;
  }

  constructor(bytesMax: number, bytesMed: number, bytesMin: number, bytesTotal: number,
    feeTotal: number, histo: TxPoolHisto, histo98pc: number, num10m: number,
    numDoubleSpends: number, numFailing: number, numNotRelayed: number, oldest: number,
    txsTotal: number
  ) {
    this.bytesMax = bytesMax;
    this.bytesMed = bytesMed;
    this.bytesMin = bytesMin;
    this.bytesTotal = bytesTotal;
    this.feeTotal = feeTotal;
    this.histo = histo;
    this.histo98pc = histo98pc;
    this.num10m = num10m;
    this.numDoubleSpends = numDoubleSpends;
    this.numFailing = numFailing;
    this.numNotRelayed = numNotRelayed;
    this.oldest = oldest;
    this.txsTotal = txsTotal;
  }

  public static parse(txPoolStats: any): TxPoolStats {
    const bytesMax: number = txPoolStats.bytes_max;
    const bytesMed: number = txPoolStats.bytes_med;
    const bytesMin: number = txPoolStats.bytes_min;
    const bytesTotal: number = txPoolStats.bytes_total;
    const feeTotal: number = txPoolStats.fee_total;
    const histo: TxPoolHisto = txPoolStats.histo ? TxPoolHisto.parse(txPoolStats.histo) : new TxPoolHisto(0, 0);
    const histo98pc: number = txPoolStats.histo_98pc;
    const num10m: number = txPoolStats.num_10m;
    const numDoubleSpends: number = txPoolStats.num_double_spends;
    const numFailing: number = txPoolStats.num_failing;
    const numNotRelayed: number = txPoolStats.num_not_relayed;
    const oldest: number = txPoolStats.oldest;
    const txsTotal: number = txPoolStats.txs_total;

    return new TxPoolStats(bytesMax, bytesMed, bytesMin, bytesTotal,
      feeTotal, histo, histo98pc, num10m,
      numDoubleSpends, numFailing, numNotRelayed, oldest,
      txsTotal);
  }

}

export class TxPoolHisto {
  public readonly txs: number;
  public readonly bytes: number;

  constructor(txs: number, bytes: number) {
    this.txs = txs;
    this.bytes = bytes;
  }

  public static parse(object: any): TxPoolHisto {
    const txs: number = object.txs;
    const bytes: number = object.bytes;

    return new TxPoolHisto(txs, bytes);
  }

}