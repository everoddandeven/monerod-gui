import { MonerodProcess } from "./MonerodProcess";
import * as os from 'os';

function copyArray<T>(src: T[], target?: T[]): T[] {
    if (!target) target = [];
    if (target.length !== 0) {
        target = [];
    }

    src.forEach((v) => target.push(v));
    return target;
}

export abstract class PrivateTestnet {
    private static get isWindows(): boolean {
        return os.platform() === 'win32';
    }

    private static get directorySeparator(): '\\' | '/' {
        return this.isWindows ? '\\' : '/';
    }

    private static readonly _node1Options: string[] = [
        '--testnet', '--no-igd', '--hide-my-port',
        '--p2p-bind-ip', '127.0.0.1', '--log-level', '0', '--add-exclusive-node', '127.0.0.1:48080',
        '--add-exclusive-node', '127.0.0.1:58080', '--rpc-access-control-origins', '*',
        '--fixed-difficulty', '500', '--disable-rpc-ban', '--non-interactive'
    ];

    private static readonly _node2Options: string[] = [
        '--testnet', '--no-igd', '--hide-my-port',
        '--p2p-bind-ip', '127.0.0.1', '--p2p-bind-port', '48080', '--rpc-bind-port' ,'48081',
        '--zmq-rpc-bind-port', '48082', '--log-level', '1', '--confirm-external-bind', '--add-exclusive-node', '127.0.0.1:28080',
        '--add-exclusive-node', '127.0.0.1:58080', '--rpc-access-control-origins', '*',
        '--fixed-difficulty', '500', '--disable-rpc-ban', '--non-interactive'
    ];

    private static _node1?: MonerodProcess;
    private static _node2?: MonerodProcess;
    private static _started: boolean = false;
    private static _mining: boolean = false;

    public static get node1(): MonerodProcess | undefined {
        return this._node1;
    }

    public static get node2(): MonerodProcess | undefined {
        return this._node2;
    }

    public static get initialized(): boolean {
        return this._node1 !== undefined && this._node2 !== undefined;
    }

    public static get started(): boolean {
        return this._started;
    }

    public static get mining(): boolean {
        return this._mining;
    }

    private static replaceAll(value: string, oldValue: string, newValue: string): string {
        let v = value;

        while(v.includes(oldValue)) v = v.replace(oldValue, newValue);

        return v;
    }

    private static parseDataDir(dataDir: string): string {
        const separator = this.directorySeparator;
        const dataDirSeparator = dataDir.includes('\\') ? '\\' : '/';
        const needsReplace = separator !== dataDirSeparator;

        if (needsReplace) return this.replaceAll(dataDir, dataDirSeparator, separator);
        return dataDir;
    }

    private static buildDataDir(monerodPath: string, dataDir: string): string {
        const separator = this.directorySeparator;

        if (monerodPath === '') return dataDir;

        const components = monerodPath.split(separator);
        components.pop();
        const path = components.join(separator);

        return `${path}${separator}${this.parseDataDir(dataDir)}`;
    }

    private static buildDataDirFlags(monerodPath: string, dataDir: string): [string, string] {
        return ['--data-dir', this.buildDataDir(monerodPath, dataDir)];
    }

    private static getNode1Flags(monerodPath: string): string[] {
        const flags = copyArray<string>(this._node1Options);
        flags.push(...this.buildDataDirFlags(monerodPath, '.localnet/xmr_local/node1'));
        return flags;
    }

    private static getNode2Flags(monerodPath: string): string[] {
        const flags = copyArray<string>(this._node2Options);
        flags.push(...this.buildDataDirFlags(monerodPath, '.localnet/xmr_local/node2'));
        return flags;
    }

    public static init(monerodPath: string): void {
        if (this.initialized) {
            throw new Error("Already initiliazed private testnet");
        }

        this._node1 = new MonerodProcess({
            monerodCmd: monerodPath,
            flags: this.getNode1Flags(monerodPath),
            isExe: true
        });
        
        this._node2 = new MonerodProcess({
            monerodCmd: monerodPath,
            flags: this.getNode2Flags(monerodPath),
            isExe: true
        });

        this._node1.privnet = this._node2.privnet = true;
    }

    public static async start(): Promise<void> {
        if (this.started) {
            throw new Error("Already started private testnet");
        }

        if (!this.initialized) {
            throw new Error("Private testnet is not initialized");
        }

        await this._node1?.start();
        await this._node2?.start();
        this._started = true;
    }

    public static async stop(): Promise<void> {
        if (!this.started) {
            throw new Error("Already stopped testnet");
        }

        await this._node1?.stop();
        await this._node2?.stop();

        this._node1 = undefined;
        this._node2 = undefined;

        this._started = false;
    }

    public static async startMining(): Promise<void> {
        if (this.mining) {
            throw new Error("Already mining");
        }

        this._mining = true;
    }

    public static async stopMining(): Promise<void> {
        if (!this.mining) {
            throw new Error("Not mining");
        }

        this._mining = false;
    }

}
