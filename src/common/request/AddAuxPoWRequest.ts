import { AuxPoW } from "../AuxPoW";
import { JsonRPCRequest } from "./JsonRPCRequest";

export class AddAuxPoWRequest extends JsonRPCRequest {
    public override readonly method: string = 'add_aux_pow';
    public override readonly restricted: boolean = true;

    public readonly blockTemplateBlob: string;
    public readonly auxPoW: AuxPoW[];

    constructor(blockTemplateBlob: string, auxPoW: AuxPoW[]) {
        super();
        this.blockTemplateBlob = blockTemplateBlob;
        this.auxPoW = auxPoW;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();
        const auxPow: { [key: string]: any }[] = [];

        this.auxPoW.forEach((pow) => auxPow.push(pow.toDictionary()));

        dict['params'] = {
            'blocktemplate_blob': this.blockTemplateBlob,
            'aux_pow': auxPow
        }

        return dict;
    }
}