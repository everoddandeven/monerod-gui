export class NetStats {
    public readonly startTime: number;
    public readonly totalPacketsIn: number;
    public readonly totalBytesIn: number;
    public readonly totalBytesOut: number;

    constructor(startTime: number, totalPacketsIn: number, totalBytesIn: number, totalBytesOut: number) {
        this.startTime = startTime;
        this.totalPacketsIn = totalPacketsIn;
        this.totalBytesIn = totalBytesIn;
        this.totalBytesOut = totalBytesOut;
    }

    public static parse(netStats: any): NetStats {
        const startTime = netStats.start_time;
        const totalPacketsIn = netStats.total_packets_in;
        const totalBytesIn = netStats.total_bytes_in;
        const totalBytesOut = netStats.total_bytes_out;

        return new NetStats(startTime, totalPacketsIn, totalBytesIn, totalBytesOut);
    }
}



/**
 * start_time - unsigned int; Unix start time.
total_packets_in - unsigned int;
total_bytes_in - unsigned int;
total_packets_out - unsigned int;
total_bytes_out - unsigned int;
status - string; General RPC error code. "OK" means everything looks good.
untrusted - boolean; States if the result is obtained using the bootstrap mode, and is therefore not trusted (true), or when the daemon is fully synced and thus handles the RPC locally (false).
 */