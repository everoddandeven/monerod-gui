export class FeeEstimate {
    public readonly fee: number;
    public readonly fees: number[];
    public readonly quantizationMask: number;

    constructor(fee: number, fees: number[], quantizationMask: number) {
        this.fee = fee;
        this.fees = fees;
        this.quantizationMask = quantizationMask;
    }

    public static parse(estimate: any): FeeEstimate {
        const fee: number = estimate.fee;
        const fees: number[] = estimate.fees ? estimate.fees : [];
        const quantizationMask: number = estimate.quantization_mask;

        return new FeeEstimate(fee, fees, quantizationMask);
    }
}