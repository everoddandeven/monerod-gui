import { SpentKeyImage } from "./SpentKeyImage";
import { UnconfirmedTx } from "./UnconfirmedTx";

export class TxPool {
  public readonly transactions: UnconfirmedTx[];
  public readonly spentKeyImages: SpentKeyImage[];

  constructor(transactions: UnconfirmedTx[], spentKeyImages: SpentKeyImage[]) {
    this.transactions = transactions;
    this.spentKeyImages = spentKeyImages;
  }

  public static parse(txPool: any): TxPool {
    const _transactions: any[] | undefined = txPool.transactions
    const _spentKeyImages: any[] | undefined = txPool.spent_key_images;
    const transactions: UnconfirmedTx[] = [];
    const spentKeyImages: SpentKeyImage[] = [];
    
    if (_transactions) _transactions.forEach((tx: any) => transactions.push(UnconfirmedTx.parse(tx)));
    if (_spentKeyImages) _spentKeyImages.forEach((ski: any) => spentKeyImages.push(SpentKeyImage.parse(ski)));

    return new TxPool(transactions, spentKeyImages);
  }
}