import { JsonRPCRequest } from "./JsonRPCRequest"

export class GetVersionRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_version';
    public override readonly restricted: boolean = false;
}