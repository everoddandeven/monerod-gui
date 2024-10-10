export class TxInfo {
    public readonly doubleSpend: boolean;
    public readonly feeTooLow: boolean;
    public readonly invalidInput: boolean;
    public readonly invalidOutput: boolean;
    public readonly lowMixin: boolean;
    public readonly notRct: boolean;
    public readonly notRelayed: boolean;
    public readonly overspend: boolean;
    public readonly reason: string;
    public readonly tooBig: boolean;

    constructor(
        doubleSpend: boolean,
        feeTooLow: boolean,
        invalidInput: boolean,
        invalidOutput: boolean,
        lowMixin: boolean,
        notRct: boolean,
        notRelayed: boolean,
        overspend: boolean,
        reason: string,
        tooBig: boolean
    ) {
        this.doubleSpend = doubleSpend;
        this.feeTooLow = feeTooLow;
        this.invalidInput = invalidInput;
        this.invalidOutput = invalidOutput;
        this.lowMixin = lowMixin;
        this.notRct = notRct;
        this.notRelayed = notRelayed;
        this.overspend = overspend;
        this.reason = reason;
        this.tooBig = tooBig;
    }

    public static parse(txInfo: any): TxInfo {
      const doubleSpend: boolean = txInfo.double_spend;
      const feeTooLow: boolean = txInfo.fee_too_low;
      const invalidInput: boolean = txInfo.invalid_input;
      const invalidOutput: boolean = txInfo.invalid_output;
      const lowMixin: boolean = txInfo.low_mixin;
      const notRct: boolean = txInfo.not_rct;
      const notRelayed: boolean = txInfo.not_relayed;
      const overspend: boolean = txInfo.overspend;
      const reason: string = txInfo.reason;
      const tooBig: boolean = txInfo.too_big;

      return new TxInfo(
          doubleSpend,
          feeTooLow,
          invalidInput,
          invalidOutput,
          lowMixin,
          notRct,
          notRelayed,
          overspend,
          reason,
          tooBig
      );
    }
}


/**
 * double_spend - boolean; Transaction is a double spend (true) or not (false).
fee_too_low - boolean; Fee is too low (true) or OK (false).
invalid_input - boolean; Input is invalid (true) or valid (false).
invalid_output - boolean; Output is invalid (true) or valid (false).
low_mixin - boolean; Mixin count is too low (true) or OK (false).
not_rct - boolean; Transaction is a standard ring transaction (true) or a ring confidential transaction (false).
not_relayed - boolean; Transaction was not relayed (true) or relayed (false).
overspend - boolean; Transaction uses more money than available (true) or not (false).
reason - string; Additional information. Currently empty or "Not relayed" if transaction was accepted but not relayed.
status - string; General RPC error code. "OK" means everything looks good. Any other value means that something went wrong.
too_big - boolean; Transaction size is too big (true) or OK (false).
untrusted - boolean; States if the result is obtained using the bootstrap mode, and is therefore not trusted (true), or when the daemon is fully synced and thus handles the RPC locally (false)
 */