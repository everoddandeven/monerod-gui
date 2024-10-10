export class UpdateInfo {
    public readonly autoUri: string;
    public readonly hash: string;
    public readonly path: string;
    public readonly update: boolean;
    public readonly userUri: string;
    public readonly version: string;

    constructor(autoUri: string, hash: string, path: string, update: boolean, userUri: string, version: string) {
        this.autoUri = autoUri;
        this.hash = hash;
        this.path = path;
        this.update = update;
        this.userUri = userUri;
        this.version = version;
    }

    public static parse(info: any): UpdateInfo {
        const autoUri: string = info.auto_uri;
        const hash: string = info.hash;
        const path: string = info.path;
        const update: boolean = info.update;
        const userUri: string = info.user_uri;
        const version: string = info.version;

        return new UpdateInfo(autoUri, hash, path, update, userUri, version);
    }
}