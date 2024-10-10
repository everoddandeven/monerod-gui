export class SpentKeyImage {
  public readonly idHash: string;
  public readonly txsHashes: string[];

  constructor(idHash: string, txsHashes: string[]) {
    this.idHash = idHash;
    this.txsHashes = txsHashes;
  }

  public static parse(spentKeyImage: any): SpentKeyImage {
    const idHash: string = spentKeyImage.id_hash;
    const txsHashes: string[] = spentKeyImage.txs_hashes;

    if (!Array.isArray(txsHashes)) {
      throw new Error(`Could not parse spent key image object`);
    }

    return new SpentKeyImage(idHash, txsHashes);
  }
}