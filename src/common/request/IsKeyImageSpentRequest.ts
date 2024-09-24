import { RPCRequest } from "./RPCRequest";

export class IsKeyImageSpentRequest extends RPCRequest {
    public override readonly method: 'is_key_image_spent' = 'is_key_image_spent';
    public override readonly restricted: false = false;

    public readonly keyImages: string[];

    constructor(keyImages: string[]) {
        super();
        this.keyImages = keyImages;
    }

    public override toDictionary(): { [key: string]: any; } {
        return {
            'key_images': this.keyImages
        }
    }
}