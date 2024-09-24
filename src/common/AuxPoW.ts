export class AuxPoW {
    public readonly id: string;
    public readonly hash: string;

    constructor(id: string, hash: string) {
        this.id = id;
        this.hash = hash;
    }

    public toDictionary(): { [key: string]: any } {
        return {
            'id': this.id,
            'hash': this.hash
        }
    }

    public static parse(auxPoW: any): AuxPoW {
        return new AuxPoW(auxPoW.id, auxPoW.hash);
    }
}