import { UpdateRequest } from "./UpdateRequest";

export class DownloadUpdateRequest extends UpdateRequest {
    
    public override readonly command: "download" | "check" = "download";

    constructor(path: string = '') {
        super("download", path);
    }
}