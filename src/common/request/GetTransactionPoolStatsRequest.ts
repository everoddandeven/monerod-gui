import { RPCRequest } from "./RPCRequest";


export class GetTransactionPoolStatsRequest extends RPCRequest {
  public override readonly method: string = 'get_transaction_pool_stats';
  public override readonly restricted: boolean = false;
  
  public toDictionary(): { [key: string]: any; } {
    return { };
  }

}