import { UpdateRequest } from "./UpdateRequest";

export class CheckUpdateRequest extends UpdateRequest {
    public override readonly command: "download" | "check" = "check";

    constructor() {
        super("check", '');
    }
}
