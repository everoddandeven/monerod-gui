import { JsonRPCRequest } from "./JsonRPCRequest";

export class SyncInfoRequest extends JsonRPCRequest {
    public override readonly method: string = 'sync_info';
    public override readonly restricted: boolean = true;
}