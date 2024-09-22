import { JsonRPCRequest } from "./JsonRPCRequest";

export class BannedRequest extends JsonRPCRequest {
    public override readonly method: string = 'banned';
    public override readonly restricted: boolean = false;

    public readonly address: string;

    constructor(address: string) {
        super();
        this.address = address;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'address': this.address
        };

        return dict;
    }
}