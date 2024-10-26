export class NetStats {
  public readonly startTime: number;
  public readonly totalPacketsIn: number;
  public readonly totalBytesIn: number;
  public readonly totalBytesOut: number;

  public get totalKiloBytesIn(): number {
    return this.totalBytesIn / 1000;
  }

  public get totalKiloBytesOut(): number {
    return this.totalBytesOut / 1000;
  }

  public get totalMegaBytesIn(): number {
    return this.totalKiloBytesIn / 1000;
  }

  public get totalMegaBytesOut(): number {
    return this.totalKiloBytesOut / 1000;
  }

  public get totalGigaBytesIn(): number {
    return this.totalMegaBytesIn / 1000;
  }

  public get totalGigaBytesOut(): number {
    return this.totalMegaBytesOut / 1000;
  }

  constructor(startTime: number, totalPacketsIn: number, totalBytesIn: number, totalBytesOut: number) {
    this.startTime = startTime;
    this.totalPacketsIn = totalPacketsIn;
    this.totalBytesIn = totalBytesIn;
    this.totalBytesOut = totalBytesOut;
  }

  public static parse(netStats: any): NetStats {
    const startTime: number = netStats.start_time;
    const totalPacketsIn: number = netStats.total_packets_in;
    const totalBytesIn: number = netStats.total_bytes_in;
    const totalBytesOut: number = netStats.total_bytes_out;

    return new NetStats(startTime, totalPacketsIn, totalBytesIn, totalBytesOut);
  }
}
