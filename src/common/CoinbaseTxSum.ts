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
        const emissionAmount = coinbaseTxSum.emission_amount;
        const emissionAmountTop64 = coinbaseTxSum.emission_amount_top64;
        const feeAmount = coinbaseTxSum.fee_amount;
        const feeAmountTop64 = coinbaseTxSum.fee_amount_top64;
        const topHash = coinbaseTxSum.top_hash;
        const wideEmissionAmount = coinbaseTxSum.wide_emission_amount;
        const wideFeeAmount = coinbaseTxSum.wide_fee_amount;

        return new CoinbaseTxSum(emissionAmount, emissionAmountTop64, feeAmount, feeAmountTop64, topHash, wideEmissionAmount, wideFeeAmount);
    }
}
