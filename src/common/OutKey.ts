
export class OutKey {
    public readonly height: number;
    public readonly key: string;
    public readonly mask: string;
    public readonly txId: string;
    public readonly unlocked: boolean;

    constructor(height: number, key: string, mask: string, txId: string, unlocked: boolean) {
        this.height = height;
        this.key = key;
        this.mask = mask;
        this.txId = txId;
        this.unlocked = unlocked;
    }

    public static parse(outkey: any): OutKey {
        const height = outkey.height;
        const key = outkey.key;
        const mask = outkey.mask;
        const txId = outkey.txid;
        const unlocked = outkey.unlocked;

        return new OutKey(height, key, mask, txId, unlocked);
    }
}


/**
 * height - unsigned int; block height of the output
key - String; the public key of the output
mask - String
txid - String; transaction id
unlocked - boolean; States if output is locked (false) or not (true)
 */