import { RPCRequest } from "./RPCRequest";

export class SendRawTransactionRequest extends RPCRequest {
    public override readonly method: 'send_raw_transaction' = 'send_raw_transaction';
    public override readonly restricted: false = false;

    public readonly txAsHex: string;
    public readonly doNotRelay: boolean;

    constructor(txAsHex: string, doNotRelay: boolean = false) {
        super();
        this.txAsHex = txAsHex;
        this.doNotRelay = doNotRelay;
    }

    public override toDictionary(): { [key: string]: any; } {
        return {
            "tx_as_hex": this.txAsHex,
            "do_not_relay": this.doNotRelay
        }
    }
}