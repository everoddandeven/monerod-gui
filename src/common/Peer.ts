import { Connection } from "./Connection";

export class Peer {
    public readonly info: Connection;

    constructor(info: Connection) {
        this.info = info;
    }

    public static parse(peer: any): Peer {
        const info: any = peer.info;
        return new Peer(Connection.parse(info));
    }
}