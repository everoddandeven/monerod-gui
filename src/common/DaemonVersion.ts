export class DaemonVersion {
    public readonly version: number;
    public readonly release: boolean;
    public readonly fullname: string;

    constructor(version: number, release: boolean, fullname: string = '') {
        this.version = version;
        this.release = release;
        this.fullname = fullname;
    }

    public static parse(version: any) {
        if (typeof version == 'string') {
            return new DaemonVersion(0, false, version);
        }
        
        const v: number = version.version;
        const release: boolean = version.release;

        return new DaemonVersion(v, release);
    }
}