import { RPCRequest } from "./RPCRequest";

export class SetLogHashRateRequest extends RPCRequest {
  public override readonly method: string = 'set_log_hash_rate';
  public override readonly restricted: boolean = true;

  public readonly visible: boolean;

  constructor(visible: boolean) {
    super();
    this.visible = visible;
  }

  public override toDictionary(): { [key: string]: any; } {
    return {
      'visible': this.visible
    };
  }
}