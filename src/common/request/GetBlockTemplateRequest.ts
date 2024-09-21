import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetBlockTemplateRequest extends JsonRPCRequest {
    public override readonly method: string = "get_block_template";
    public readonly walletAddress: string;
    public readonly reserveSize: number;
  
    constructor(walletAddress: string, reserveSize: number) {
      super();
      this.walletAddress = walletAddress;
      this.reserveSize = reserveSize;
    }
  
    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'wallet_address': this.walletAddress,
            'reserve_size': this.reserveSize
        }
  
        return dict;
    }
}