import { RpcError } from "./RpcError";

export class MethodNotFoundError extends RpcError {

    constructor() {
        super(-32601, 'Method not found');
    }
}