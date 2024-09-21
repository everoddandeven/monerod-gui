import { JsonRPCRequest } from "./JsonRPCRequest";

export class GetMinerDataRequest extends JsonRPCRequest {
    public override readonly method: string = 'get_miner_data';

    
}