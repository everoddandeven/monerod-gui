import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetOutputHistogramRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_output_histogram';
    public override readonly restricted: boolean = false;
    public readonly amounts: number[];
    public readonly minCount: number;
    public readonly maxCount: number;
    public readonly unlocked: boolean;
    public readonly recentCutoff: number;

    constructor(amounts: number[], minCount: number, maxCount: number, unlocked: boolean, recentCutoff: number) {
        super();
        this.amounts = amounts;
        this.minCount = minCount;
        this.maxCount = maxCount;
        this.unlocked = unlocked;
        this.recentCutoff = recentCutoff;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'amounts': this.amounts,
            'min_count': this.minCount,
            'max_count': this.maxCount,
            'unlocked': this.unlocked,
            'recentCutoff': this.recentCutoff
        }

        return dict;
    }
}