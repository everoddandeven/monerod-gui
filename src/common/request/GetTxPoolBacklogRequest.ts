import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetTxPoolBacklogRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_txpool_backlog';
    public override readonly restricted: boolean = false;
}
