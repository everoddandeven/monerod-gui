import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetBansRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_bans';
    public override readonly restricted: boolean = true;
}