export class FeeEstimate {
    public readonly fee: number;
    public readonly fees: number[];
    public readonly quantizationMask: number;

    public get feeXMR(): string {
        return (this.fee / 1e12).toFixed(12);
    }

    public get feesXMR(): string[] {
        const fees: string[] = [];
        this.fees.forEach((f) => fees.push((f / 1e12).toFixed(12)));
        return fees;
    }

    public get quantizationMaskXMR(): string {
        return (this.quantizationMask / 1e12).toFixed(12);
    }

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
