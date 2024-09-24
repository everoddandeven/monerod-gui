import { RPCRequest } from "./RPCRequest";

export class UpdateRequest extends RPCRequest {
    public override readonly method: string = 'update';
    public override readonly restricted: boolean = true;

    public readonly command: 'check' | 'download';
    public readonly path: string;
    
    constructor(command: 'check' | 'download', path: string = '') {
        super();
        this.command = command;
        this.path = path;
    }

    public override toDictionary(): { [key: string]: any; } {
        const dict: { [key: string]: any } = {
            'command': this.command
        };

        if (this.path != '') {
            dict['path'] = this.path;
        }

        return dict;
    }
}