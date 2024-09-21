export abstract class JsonRPCRequest {
    public readonly version: string = "2.0";
    public readonly id: string = "0";
    public abstract readonly method: string;
  
    public toDictionary(): { [key: string]: any } {
      return {
        "jsonrpc": this.version,
        "id": this.id,
        "method": this.method
      }
    }
  }