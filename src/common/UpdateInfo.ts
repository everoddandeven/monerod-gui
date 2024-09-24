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
        const autoUri = info.auto_uri;
        const hash = info.hash;
        const path = info.path;
        const update = info.update;
        const userUri = info.user_uri;
        const version = info.version;

        return new UpdateInfo(autoUri, hash, path, update, userUri, version);
    }
}