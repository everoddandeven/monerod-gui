import { RPCRequest } from "./RPCRequest";

export class GetTransactionPoolRequest extends RPCRequest {
  public override readonly method: 'get_transaction_pool' = 'get_transaction_pool';
  public override readonly restricted: boolean = false;

  public override toDictionary(): { [key: string]: any; } {
    return {};
  }
  
}