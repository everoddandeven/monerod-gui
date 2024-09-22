import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetBlockHashRequest extends JsonRPCRequest {
    public override readonly method: string = "on_get_block_hash";
    public override readonly restricted: boolean = false;
    public readonly blockHeight: number;
  
    constructor(blockHeight: number) {
      super();
      this.blockHeight = blockHeight;
    }
  
    public override toDictionary(): { [key: string]: any; } {
      const dict = super.toDictionary();
  
      dict['params'] = [this.blockHeight];
  
      return dict;
    }
  }