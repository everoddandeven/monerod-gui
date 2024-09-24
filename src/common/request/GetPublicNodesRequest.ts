import { RPCRequest } from "./RPCRequest";

export class GetPublicNodesRequest extends RPCRequest {
    public override readonly method: 'get_public_nodes' = 'get_public_nodes';
    public override readonly restricted: boolean = false;

    public readonly whites: boolean;
    public readonly grays: boolean;
    public readonly includeBlocked: boolean;

    constructor(whites: boolean = true, grays: boolean = false, includeBlocked: boolean = false) {
        super();

        this.whites = whites;
        this.grays = grays;
        this.includeBlocked = includeBlocked;
    }

    public override toDictionary(): { [key: string]: any; } {
        return {
            'whites': this.whites,
            'grays': this.grays,
            'include_blocked': this.includeBlocked
        };
    }
}