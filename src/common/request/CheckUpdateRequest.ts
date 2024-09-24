import { UpdateRequest } from "./UpdateRequest";

export class CheckUpdateRequest extends UpdateRequest {
    public override readonly command: "check" = "check";

    constructor() {
        super("check", '');
    }
}
