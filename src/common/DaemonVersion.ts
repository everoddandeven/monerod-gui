export class DaemonVersion {
    public readonly version: number;
    public readonly release: boolean;

    constructor(version: number, release: boolean) {
        this.version = version;
        this.release = release;
    }

    public static parse(version: any) {
        const v: number = version.version;
        const release: boolean = version.release;

        return new DaemonVersion(v, release);
    }
}