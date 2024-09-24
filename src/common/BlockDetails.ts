import { MinerTx } from "./MinerTx";

export class BlockDetails {
    public majorVersion: number;
    public minorVersion: number;
    public timestamp: number;
    public prevId: string;
    public nonce: number;
    public minerTx: MinerTx;
    public txHashes: string[];

    constructor(majorVersion: number, minorVersion: number, timestamp: number, prevId: string, nonce: number, minerTx: MinerTx, txHashes: string[]) {
        this.majorVersion = majorVersion;
        this.minorVersion = minorVersion;
        this.timestamp = timestamp;
        this.prevId = prevId;
        this.nonce = nonce;
        this.minerTx = minerTx;
        this.txHashes = txHashes;
    }

    public static parse(details: string): BlockDetails {
        const blockDetails = JSON.parse(details);
        const majorVersion = blockDetails.major_version;
        const minorVersion = blockDetails.minor_version;
        const timestamp = blockDetails.timestamp;
        const prevId = blockDetails.prev_id;
        const nonce = blockDetails.nonce;
        const minerTx = MinerTx.parse(blockDetails.miner_tx);
        const txHashes = blockDetails.tx_hashes;

        return new BlockDetails(majorVersion, minorVersion, timestamp, prevId, nonce, minerTx, txHashes);
    }
}
