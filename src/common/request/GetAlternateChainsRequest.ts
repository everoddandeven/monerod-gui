import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetAlternateChainsRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_alternate_chains';
    public override readonly restricted: boolean = true;
}