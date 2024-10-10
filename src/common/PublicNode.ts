export class PublicNode {
    public readonly host: string;
    public readonly lastSeen: number;
    public readonly rpcCreditsPerHash: number;
    public readonly rpcPort: number;
    public readonly type: 'white' | 'gray';

    public readonly lastSeenDateTime: string;

    constructor(type: 'white' | 'gray', host: string, lastSeen: number, rpcCreditsPerHash: number, rpcPort: number) {
        this.host = host;
        this.lastSeen = lastSeen;
        this.rpcCreditsPerHash = rpcCreditsPerHash;
        this.rpcPort = rpcPort;
        this.type = type;

        const date = new Date(this.lastSeen * 1000);
        this.lastSeenDateTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }

    public static parse(publicNode: any, nodeType: 'white' | 'gray'): PublicNode {
        const host: string = publicNode.host;
        const lastSeen: number = publicNode.last_seen;
        const rpcCreditsPerHash: number = publicNode.rpc_credits_per_hash;
        const rpcPort: number = publicNode.rpc_port;

        return new PublicNode(nodeType, host, lastSeen, rpcCreditsPerHash, rpcPort);
    }
}

/**
 * host - string; The node's IP address. This includes IPv4, IPv6, Onion, and i2p addresses.
last_seen - unsigned int; UNIX timestamp of the last time the node was seen.
rpc_credits_per_hash - unsigned int; If payment for RPC is enabled, the number of credits the node is requesting per hash. Otherwise, 0.
rpc_port - unsigned int; RPC port number of the node.
 */