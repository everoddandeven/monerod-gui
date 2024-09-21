import { JsonRPCRequest } from "./JsonRPCRequest";

export class PruneBlockchainRequest extends JsonRPCRequest {
    public override readonly method: string = 'prune_blockchain';
    public readonly check: boolean;

    constructor(check: boolean = false) {
        super();

        this.check = check;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();
        
        dict['params'] = {
            'check': this.check
        };

        return dict;
    }
}