export class MineableTxBacklog {
    public readonly id: string;
    public readonly weight: number;
    public readonly fee: number;

    constructor(id: string, weight: number, fee: number) {
        this.id = id;
        this.weight = weight;
        this.fee = fee;
    }

    public static parse(txBacklog: any): MineableTxBacklog {
        const id: string = txBacklog.id;
        const weight: number = txBacklog.weight;
        const fee: number = txBacklog.fee;

        return new MineableTxBacklog(id, weight, fee);
    }
}