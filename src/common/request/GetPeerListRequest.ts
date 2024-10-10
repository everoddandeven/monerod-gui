import { RPCRequest } from "./RPCRequest";

export class GetPeerListRequest extends RPCRequest {
  public override readonly method: string = 'get_peer_list';
  public override readonly restricted: boolean = true;

  public override toDictionary(): { [key: string]: any; } {
    return {};
  }
  
}