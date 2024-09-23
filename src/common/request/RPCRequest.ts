export abstract class RPCRequest {
    public abstract readonly method: string;
    public abstract readonly restricted: boolean;

    public abstract toDictionary(): { [key: string]: any };

}