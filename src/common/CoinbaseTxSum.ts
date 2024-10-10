export class CoinbaseTxSum {
    public readonly emissionAmount: number;
    public readonly emissionAmountTop64: number;
    public readonly feeAmount: number;
    public readonly feeAmountTop64: number;
    public readonly topHash: string;
    public readonly wideEmissionAmount: string;
    public readonly wideFeeAmount: string;

    constructor(emissionAmount: number, emissionAmountTop64: number, feeAmount: number, feeAmountTop64: number, topHash: string, wideEmissionAmount: string, wideFeeAmount: string) {
        this.emissionAmount = emissionAmount;
        this.emissionAmountTop64 = emissionAmountTop64;
        this.feeAmount = feeAmount;
        this.feeAmountTop64 = feeAmountTop64;
        this.topHash = topHash;
        this.wideEmissionAmount = wideEmissionAmount;
        this.wideFeeAmount = wideFeeAmount;
    }

    public static parse(coinbaseTxSum: any): CoinbaseTxSum {
        const emissionAmount: number = coinbaseTxSum.emission_amount;
        const emissionAmountTop64: number = coinbaseTxSum.emission_amount_top64;
        const feeAmount: number = coinbaseTxSum.fee_amount;
        const feeAmountTop64: number = coinbaseTxSum.fee_amount_top64;
        const topHash: string = coinbaseTxSum.top_hash;
        const wideEmissionAmount: string = coinbaseTxSum.wide_emission_amount;
        const wideFeeAmount: string = coinbaseTxSum.wide_fee_amount;

        return new CoinbaseTxSum(emissionAmount, emissionAmountTop64, feeAmount, feeAmountTop64, topHash, wideEmissionAmount, wideFeeAmount);
    }
}
