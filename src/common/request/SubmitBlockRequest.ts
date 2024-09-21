import { JsonRPCRequest } from "./JsonRPCRequest";

export class SubmitBlockRequest extends JsonRPCRequest {
    public override method: string = "submit_block";
    public readonly blockBlobData: string[];

    constructor(blockBlobData: string[]) {
        super();
        this.blockBlobData = blockBlobData;
    }

    public override toDictionary(): { [key: string]: any; } {
        let dict = super.toDictionary();

        dict['params'] = this.blockBlobData;

        return dict;
    }
}