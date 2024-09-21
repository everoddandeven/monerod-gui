import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetConnectionsRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_connections';
}