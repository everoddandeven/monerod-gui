import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetInfoRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_info';
}