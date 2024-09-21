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
        const fee = estimate.fee;
        const fees = estimate.fees;
        const quantizationMask = estimate.quantization_mask;

        return new FeeEstimate(fee, fees, quantizationMask);
    }
}