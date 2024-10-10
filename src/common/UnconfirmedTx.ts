
export class UnconfirmedTx {
  public readonly blobSize: number;
  public readonly doNotRelay: boolean;
  public readonly doubleSpendSeen: boolean;
  public readonly fee: number;
  public readonly idHash: string;
  public readonly keptByBlock: boolean;
  public readonly lastFailedHeight: number;
  public readonly lastFailedIdHash: string;
  public readonly lastRelayedTime: number;
  public readonly maxUsedBlockHeight: number;
  public readonly maxUsedBlockIdHash: string;
  public readonly receiveTime: number;
  public readonly relayed: boolean;
  public readonly txBlob: string;


  constructor(
    blobSize: number,
    doNotRelay: boolean,
    doubleSpendSeen: boolean,
    fee: number,
    idHash: string,
    keptByBlock: boolean,
    lastFailedHeight: number,
    lastFailedIdHash: string,
    lastRelayedTime: number,
    maxUsedBlockHeight: number,
    maxUsedBlockIdHash: string,
    receiveTime: number,
    relayed: boolean,
    txBlob: string
  ) {
    this.blobSize = blobSize;
    this.doNotRelay = doNotRelay;
    this.doubleSpendSeen = doubleSpendSeen;
    this.fee = fee;
    this.idHash = idHash;
    this.keptByBlock = keptByBlock;
    this.lastFailedHeight = lastFailedHeight;
    this.lastFailedIdHash = lastFailedIdHash;
    this.lastRelayedTime = lastRelayedTime;
    this.maxUsedBlockHeight = maxUsedBlockHeight;
    this.maxUsedBlockIdHash = maxUsedBlockIdHash;
    this.receiveTime = receiveTime;
    this.relayed = relayed;
    this.txBlob = txBlob;
  }

  public static parse(unconfirmedTx: any): UnconfirmedTx {
    const blobSize: number = unconfirmedTx.blob_size;
    const doNotRelay: boolean = unconfirmedTx.do_not_relay;
    const doubleSpendSeen: boolean = unconfirmedTx.double_spend_seen;
    const fee: number = unconfirmedTx.fee;
    const idHash: string = unconfirmedTx.id_hash;
    const keptByBlock: boolean = unconfirmedTx.kept_by_block;
    const lastFailedHeight: number = unconfirmedTx.last_failed_height;
    const lastFailedIdHash: string = unconfirmedTx.last_failed_id_hash;
    const lastRelayedTime: number = unconfirmedTx.last_relayed_time;
    const maxUsedBlockHeight: number = unconfirmedTx.max_used_block_height;
    const maxUsedBlockIdHash: string = unconfirmedTx.max_used_block_id_hash;
    const receiveTime: number = unconfirmedTx.receive_time;
    const relayed: boolean = unconfirmedTx.relayed;
    const txBlob: string = unconfirmedTx.tx_blob;

    return new UnconfirmedTx(
      blobSize, doNotRelay, doubleSpendSeen, fee, idHash, keptByBlock,
      lastFailedHeight, lastFailedIdHash, lastRelayedTime, maxUsedBlockHeight,
      maxUsedBlockIdHash, receiveTime, relayed, txBlob
    );
  }
}

/**
 * blob_size - unsigned int; The size of the full transaction blob.
do_not_relay; boolean; States if this transaction should not be relayed
double_spend_seen - boolean; States if this transaction has been seen as double spend.
fee - unsigned int; The amount of the mining fee included in the transaction, in atomic units.
id_hash - string; The transaction ID hash.
kept_by_block - boolean; States if the tx was included in a block at least once (true) or not (false).
last_failed_height - unsigned int; If the transaction validation has previously failed, this tells at what height that occurred.
last_failed_id_hash - string; Like the previous, this tells the previous transaction ID hash.
last_relayed_time - unsigned int; Last unix time at which the transaction has been relayed.
max_used_block_height - unsigned int; Tells the height of the most recent block with an output used in this transaction.
max_used_block_id_hash - string; Tells the hash of the most recent block with an output used in this transaction.
receive_time - unsigned int; The Unix time that the transaction was first seen on the network by the node.
relayed - boolean; States if this transaction has been relayed
tx_blob - unsigned int; Hexadecimal blob representing the transaction.
 */