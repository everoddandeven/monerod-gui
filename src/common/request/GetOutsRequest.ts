import { Output } from "../Output";
import { RPCRequest } from "./RPCRequest";

export class GetOutsRequest extends RPCRequest {
    public override readonly method: string = 'get_outs';
    public override readonly restricted: boolean = false;

    public readonly outputs: Output[];
    public readonly getTxId: boolean;

    constructor(outputs: Output[], getTxId: boolean) {
        super();
        this.outputs = outputs;
        this.getTxId = getTxId;
    }

    public override toDictionary(): { [key: string]: any; } {
        const outputs: { [key: string]: any }[] = [];
        this.outputs.forEach((output) => outputs.push(output.toDictionary()))
        
        return {
            'outputs': outputs,
            'get_txid': this.getTxId
        }
    }
}