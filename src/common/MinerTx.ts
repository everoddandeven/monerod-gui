export class MinerTx {
    public readonly version: number;
    public readonly unlockTime: number;
    public readonly vin: TxInput[];
    public readonly vout: TxOutput[];
    public readonly extra: number[];
    public readonly rctSignatures?: RctSignatures;

    constructor(version: number, unlockTime: number, vin: TxInput[], vout: TxOutput[], extra: number[], rctSignatures?: RctSignatures) {
        this.version = version;
        this.unlockTime = unlockTime;
        this.vin = vin;
        this.vout = vout;
        this.extra = extra;
        this.rctSignatures = rctSignatures;
    }

    public static parse(minerTx: any): MinerTx {
        const version = minerTx.version;
        const unlockTime = minerTx.unlock_time;
        const _vin: any[] | undefined = minerTx.vin;
        const _vout: any[] | undefined = minerTx.vout;
        const extra = minerTx.extra;
        let rctSignatures;

        if (minerTx.rct_signatures) {
          rctSignatures = RctSignatures.parse(minerTx.rct_signatures);
        }
        
        const vin: TxInput[] = [];
        const vout: TxOutput[] = [];

        if (_vin) _vin.forEach((v) => vin.push(TxInput.parse(v)));
        if (_vout) _vout.forEach((v) => vout.push(TxOutput.parse(v)));

        return new MinerTx(version, unlockTime, vin, vout, extra, rctSignatures);
    }
}

export class TxInput {
    public readonly gen: TxInputGen;

    constructor(gen: TxInputGen) {
        this.gen = gen;
    }

    public static parse(input: any): TxInput {
        const gen = TxInputGen.parse(input.gen);
        return new TxInput(gen);
    }
}

export class TxInputGen {
    public readonly height: number;

    constructor(height: number) {
        this.height = height;
    }

    public static parse(gen: any): TxInputGen {
        const height = gen.height;

        return new TxInputGen(height);
    }
}

export class TxOutput {
    public readonly amount: number;
    public readonly target: TxOutputTarget;

    constructor(amount: number, target: TxOutputTarget) {
        this.amount = amount;
        this.target = target;
    }

    public static parse(out: any): TxOutput {
        const amount = out.amount;
        const target = TxOutputTarget.parse(out.target);

        return new TxOutput(amount, target);
    }

}

export class RctSignatures {
    public readonly type: number;

    constructor(type: number) {
        this.type = type;
    }

    public static parse(rctSignatures: any): RctSignatures {
        const type = rctSignatures.type;

        return new RctSignatures(type);
    }
}

export class TxOutputTarget {
    public readonly viewKey: string;
    public readonly viewTag: string;

    constructor(viewKey: string, viewTag: string) 
    {
        this.viewKey = viewKey;
        this.viewTag = viewTag;
    }

    public static parse(target: any): TxOutputTarget {
      const viewKey = target.view_key ? target.view_key : '';
      const viewTag = target.view_tag ? target.view_tag : '';

      return new TxOutputTarget(viewKey, viewTag);
    }
}

