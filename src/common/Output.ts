export class Output {
    public readonly amount: number;
    public readonly index: number;

    constructor(amount: number, index: number) {
        this.amount = amount;
        this.index = index;
    }

    public toDictionary(): { [key: string]: any } {
        return {
            'amount': this.amount,
            'index': this.index
        }
    }

    public static parse(out: any): Output {
      return new Output(out.amount, out.index);
    }
}