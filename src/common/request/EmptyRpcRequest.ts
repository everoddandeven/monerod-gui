import { JsonRPCRequest } from "./JsonRPCRequest";

export class EmptyRpcRequest extends JsonRPCRequest {
    public override readonly restricted: boolean = false;
    public override readonly method: string = "";
}