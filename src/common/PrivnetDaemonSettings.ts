import { DaemonSettings } from "./DaemonSettings";

export class PrivnetDaemonSettings extends DaemonSettings {

    protected _dataDir: string;

    public override get isPrivnet(): boolean {
        return true;
    }

    constructor(monerodPath: string, dataDir: string) {
        super();
        this.testnet = true;
        this.noIgd = true;
        this.hideMyPort = true;
        this.p2pBindIp = '127.0.0.1';
        this.logLevel = 0;
        this.rpcAccessControlOrigins = '*';
        this.fixedDifficulty = 500;
        this.disableRpcBan = true;
        this.syncOnWifi = true;
        this._dataDir = dataDir;
        this.setMonerodPath(monerodPath);
    }

    private refreshDataDir(): void {
        if (this.monerodPath == '') {
            this.dataDir = '';
            return;
        }

        const separator: '\\' | '/' = this.monerodPath.includes('\\') ? '\\' : '/';
        const dataDirSeparator: '\\' | '/' = this._dataDir.includes('\\') ? '\\' : '/';
        const needsReplace = dataDirSeparator !== separator;

        const dataDir = needsReplace ? this._dataDir.replaceAll(dataDirSeparator, separator) : this._dataDir;

        const components = this.monerodPath.split(separator);
        components.pop();
        const path = components.join(separator);

        this.dataDir = `${path}${separator}${dataDir}`;
    }

    public setMonerodPath(monerodPath: string): void {
        this.monerodPath = monerodPath;

        this.refreshDataDir();
    }
}