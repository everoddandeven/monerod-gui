
export class BlockCount {
    public count: number;
    public status: string;
    public untrusted: boolean;

    constructor(count: number, status: string, untrusted: boolean) {
        this.count = count;
        this.status = status;
        this.untrusted = untrusted;
    }

    public static parse(blockCount: any): BlockCount {
        if (blockCount == null) {
            throw new Error("Cannot parse null value");
        }

        const count: number = parseInt(blockCount.count);

        if (typeof blockCount.status != "string") {
            throw new Error("Invalid block count status");
        }

        const status: string = blockCount.status;
        const untrusted: boolean = blockCount.untrusted == true ? true : false;

        return new BlockCount(count, status, untrusted);
    } 
}