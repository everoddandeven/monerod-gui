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
      const id: string = auxPoW.id;
      const hash: string = auxPoW.hash;

      if (typeof id != 'string' || typeof hash != 'string') {
        throw new Error("Could not parse aux pow object");
      }

      return new AuxPoW(id, hash);
    }
}