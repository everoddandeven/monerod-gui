/**
 * 
    connection_id - string; Id of connection
    nblocks - unsigned int; number of blocks in that span
    rate - unsigned int; connection rate
    remote_address - string; peer address the node is downloading (or has downloaded) than span from
    size - unsigned int; total number of bytes in that span's blocks (including txes)
    speed - unsigned int; connection speed
    start_block_height - unsigned int; block height of the first block in that span

 */

export class Span {
    public readonly connectionId: string;
    public readonly nBlocks: number;
    public readonly rate: number;
    public readonly remoteAddress: string;
    public readonly size: number;
    public readonly speed: number;
    public readonly startBlockHeight: number;
    
    constructor(connectionId: string, nBlocks: number, rate: number, remoteAddress: string, size: number, speed: number, startBlockHeight: number) {
        this.connectionId = connectionId;
        this.nBlocks = nBlocks;
        this.rate = rate;
        this.remoteAddress = remoteAddress;
        this.size = size;
        this.speed = speed;
        this.startBlockHeight = startBlockHeight;
    }

    public static parse(span: any): Span {
        const connectionId: string = span.connection_id;
        const nBlocks: number = span.nblocks;
        const rate: number = span.rate;
        const remoteAddress: string = span.remote_address;
        const size: number = span.size;
        const speed: number = span.speed;
        const startBlockHeight: number = span.start_block_height;

        return new Span(connectionId, nBlocks, rate, remoteAddress, size, speed, startBlockHeight);
    }
}