import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetBlockCountRequest extends JsonRPCRequest {
    public override readonly method: string = "get_block_count";
}
