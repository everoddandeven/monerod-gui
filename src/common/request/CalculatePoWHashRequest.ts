import { JsonRPCRequest } from "./JsonRPCRequest";

export class CalculatePoWHashRequest extends JsonRPCRequest {
    public override readonly method: string = 'calc_pow';
    public override readonly restricted: boolean = false;
    public readonly majorVersion: number;
    public readonly height: number;
    public readonly blockBlob: string;
    public readonly seedHash: string;

    constructor(majorVersion: number, height: number, blockBlob: string, seedHash: string) {
        super();
        this.majorVersion = majorVersion;
        this.height = height;
        this.blockBlob = blockBlob;
        this.seedHash = seedHash;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict = super.toDictionary();

        dict['params'] = {
            'major_version': this.majorVersion,
            'height': this.height,
            'blockBlob': this.blockBlob,
            'seedHash': this.seedHash
        }

        return dict;
    }

}