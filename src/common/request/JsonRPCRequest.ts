import { RPCRequest } from "./RPCRequest";

export abstract class JsonRPCRequest extends RPCRequest {
    public readonly version: string = "2.0";
    public readonly id: string = "0";
  
    public toDictionary(): { [key: string]: any } {
      return {
        "jsonrpc": this.version,
        "id": this.id,
        "method": this.method
      }
    }
  }