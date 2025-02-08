import { MonerodProcess } from "./MonerodProcess";

export abstract class PrivateTestnet {
    private static readonly _node1Options: string[] = [
        '--testnet', '--no-igd', '--hide-my-port', '--data-dir', '.localnet/xmr_local/node1',
        '--p2p-bind-ip', '127.0.0.1', '--log-level', '0', '--add-exclusive-node', '127.0.0.1:48080',
        '--add-exclusive-node', '127.0.0.1:58080', '--rpc-access-control-origins', '*',
        '--fixed-difficulty', '500', '--disable-rpc-ban', '--non-interactive'
    ];

    private static readonly _node2Options: string[] = [
        '--testnet', '--no-igd', '--hide-my-port', '--data-dir', '.localnet/xmr_local/node2',
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

    public static init(monerodPath: string): void {
        if (this.initialized) {
            throw new Error("Already initiliazed private testnet");
        }

        this._node1 = new MonerodProcess({
            monerodCmd: monerodPath,
            flags: this._node1Options,
            isExe: true
        });
        
        this._node2 = new MonerodProcess({
            monerodCmd: monerodPath,
            flags: this._node2Options,
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
