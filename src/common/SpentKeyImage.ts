export class SpentKeyImage {
  public readonly idHash: string;
  public readonly txsHashes: string[];

  constructor(idHash: string, txsHashes: string[]) {
    this.idHash = idHash;
    this.txsHashes = txsHashes;
  }

  public static parse(spentKeyImage: any): SpentKeyImage {
    const idHash = spentKeyImage.id_hash;
    const txsHashes = spentKeyImage.txs_hashes;

    return new SpentKeyImage(idHash, txsHashes);
  }
}