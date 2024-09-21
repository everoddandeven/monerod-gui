import { Ban } from "../Ban";
import { JsonRPCRequest } from "./JsonRPCRequest";

export class SetBansRequest extends JsonRPCRequest {
    public override readonly method: string = 'set_bans';
    public bans: Ban[];
    
    constructor(bans: Ban[]) {
        super();

        this.bans = bans;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();
        const bans: { [key: string]: any }[] = []

        this.bans.forEach((ban) => bans.push(ban.toDictionary()));

        dict['params'] = {
            'bans': bans
        }

        return dict;
    }
}