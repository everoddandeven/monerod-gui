import { RPCRequest } from "./RPCRequest";

export class SetBootstrapDaemonRequest extends RPCRequest {
    public override readonly method: 'set_bootstrap_daemon' = 'set_bootstrap_daemon';
    public override readonly restricted: true = true;

    public readonly address: string;
    public readonly username: string;
    public readonly password: string;
    public readonly proxy: string;

    constructor(address: string, username: string, password: string, proxy: string) {
        super();
        this.address = address;
        this.username = username;
        this.password = password;
        this.proxy = proxy;
    }

    public override toDictionary(): { [key: string]: any; } {
        return {
            'address': this.address,
            'username': this.username,
            'password': this.password,
            'proxy': this.proxy
        }
    }
}