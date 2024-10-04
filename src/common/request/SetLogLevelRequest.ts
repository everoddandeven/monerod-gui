import { RPCRequest } from "./RPCRequest";

export class SetLogLevelRequest extends RPCRequest {
  public override readonly method: 'set_log_level' = 'set_log_level';
  public override readonly restricted: boolean = true;

  public readonly level: number;

  constructor(level: number) {
    super();
    if (level < 0 || level > 4) {
      throw new Error(`Invalid log level provided: ${level}`);
    }
    this.level = level;
  }

  public toDictionary(): { [key: string]: any; } {
    return {
      'level': this.level
    };
  }
  
}