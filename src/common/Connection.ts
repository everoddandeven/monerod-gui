/**
 * 
    address - string; The peer's address, actually IPv4 & port
    avg_download - unsigned int; Average bytes of data downloaded by node.
    avg_upload - unsigned int; Average bytes of data uploaded by node.
    connection_id - string; The connection ID
    current_download - unsigned int; Current bytes downloaded by node.
    current_upload - unsigned int; Current bytes uploaded by node.
    height- unsigned int; The peer height
    host - string; The peer host
    incoming - boolean; Is the node getting information from your node?
    ip - string; The node's IP address.
    live_time - unsigned int
    local_ip - boolean
    localhost - boolean
    peer_id - string; The node's ID on the network.
    port - string; The port that the node is using to connect to the network.
    recv_count - unsigned int
    recv_idle_time - unsigned int
    send_count - unsigned int
    send_idle_time - unsigned int
    state - string
    support_flags - unsigned int

 */

export class Connection {
    public readonly address: string;
    public readonly avgDownload: number;
    public readonly avgUpload: number;
    public readonly connectionId: string;
    public readonly currentDownload: number;
    public readonly currentUpload: number;
    public readonly height: number;
    public readonly host: number;
    public readonly incoming: boolean;
    public readonly ip: string;
    public readonly liveTime: number;
    public readonly localIp: boolean;
    public readonly localhost: boolean;
    public readonly peerId: string;
    public readonly port: string;
    public readonly pruningSeed: number;
    public readonly recvCount: number;
    public readonly recvIdleTime: number;
    public readonly sendCount: number;
    public readonly sendIdleTime: number;
    public readonly state: string;
    public readonly supportFlags: number;

    constructor(address: string, avgDownload: number, avgUpload: number, connectionId: string, currentDownload: number, currentUpload: number, height: number, host: number, incoming: boolean, ip: string, liveTime: number, localIp: boolean, localhost: boolean, peerId: string, port: string, pruningSeed: number, recvCount: number, recvIdleTime: number, sendCount: number, sendIdleTime: number, state: string, supportFlags: number) {
        this.address = address;
        this.avgDownload = avgDownload;
        this.avgUpload = avgUpload;
        this.connectionId = connectionId;
        this.currentDownload = currentDownload;
        this.currentUpload = currentUpload;
        this.height = height;
        this.host = host;
        this.incoming = incoming;
        this.ip = ip;
        this.liveTime = liveTime;
        this.localIp = localIp;
        this.localhost = localhost;
        this.peerId = peerId;
        this.port = port;
        this.pruningSeed = pruningSeed
        this.recvCount = recvCount;
        this.recvIdleTime = recvIdleTime;
        this.sendCount = sendCount;
        this.sendIdleTime = sendIdleTime;
        this.state = state;
        this.supportFlags = supportFlags;
    }

    public static parse(connection: any): Connection {
        const address = connection.address;
        const avgDownload = connection.avg_download;
        const avgUpload = connection.avg_upload;
        const connectionId = connection.connection_id;
        const currentDownload = connection.current_download;
        const currentUpload = connection.current_upload;
        const height = connection.height;
        const host = connection.host;
        const incoming = connection.incoming;
        const ip = connection.ip;
        const liveTime = connection.live_time;
        const localIp = connection.local_ip;
        const localhost = connection.localhost;
        const peerId = connection.peer_id;
        const port = connection.port;
        const pruningSeed = connection.pruning_seed;
        const recvCount = connection.recv_count;
        const recvIdleTime = connection.recv_idle_time;
        const sendCount = connection.send_count;
        const sendIdleTime = connection.send_idle_time;
        const state = connection.state;
        const supportFlags = connection.support_flags;

        return new Connection(address, avgDownload, avgUpload, connectionId, currentDownload, currentUpload, height, host, incoming, ip, liveTime, localIp, localhost, peerId, port, pruningSeed, recvCount, recvIdleTime, sendCount, sendIdleTime, state, supportFlags);
    }
}