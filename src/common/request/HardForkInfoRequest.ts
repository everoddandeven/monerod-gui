import { JsonRPCRequest } from "./JsonRPCRequest";

export class HardForkInfoRequest extends JsonRPCRequest {
    public override readonly method: string = 'hard_fork_info';
    public override readonly restricted: boolean = false;
}
