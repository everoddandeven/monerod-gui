export class TxBacklogEntry {
  public readonly blobSize: number;
  public readonly fee: number;
  public readonly timeInPool: number;

  constructor(blobSize: number, fee: number, timeInPool: number) {
    this.blobSize = blobSize;
    this.fee = fee;
    this.timeInPool = timeInPool;
  }

  public static fromBinary(binary: string): TxBacklogEntry[] {
    console.debug(binary);
    throw new Error("TxBacklogEntry.fromBinary(): not implemented");
  }
}