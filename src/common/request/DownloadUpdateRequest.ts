import { UpdateRequest } from "./UpdateRequest";

export class DownloadUpdateRequest extends UpdateRequest {
    
    public override readonly command: "download" = "download";

    constructor(path: string = '') {
        super("download", path);
    }
}