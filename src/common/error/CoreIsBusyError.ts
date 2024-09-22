import { RpcError } from "./RpcError";

export class CoreIsBusyError extends RpcError {

    constructor() {
        super(-9, "Core is busy");
    }
}