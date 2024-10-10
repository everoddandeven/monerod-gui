export class PeerInfo {
  public readonly type: 'white' | 'gray';
  public readonly host: number;
  public readonly id: string;
  public readonly ip: number;
  public readonly lastSeen: number;
  public readonly port: number;

  constructor(type: 'white' | 'gray', host: number, id: string, ip: number, lastSeen: number, port: number) {
    this.type = type;
    this.host = host;
    this.id = id;
    this.ip = ip;
    this.lastSeen = lastSeen;
    this.port = port;
  }

  public static parse(peerInfo: any, type: 'white' | 'gray'): PeerInfo {
    const host: number = peerInfo.host;
    const id: string = peerInfo.id;
    const ip: number = peerInfo.ip;
    const lastSeen: number = peerInfo.last_seen;
    const port: number = peerInfo.port;

    return new PeerInfo(type, host, id, ip, lastSeen, port);
  }
}

/**
 * host - unsigned int; IP address in integer format
id - string; Peer id
ip - unsigned int; IP address in integer format
last_seen - unsigned int; unix time at which the peer has been seen for the last time
port - unsigned int; TCP port the peer is using to connect to monero network.
 */