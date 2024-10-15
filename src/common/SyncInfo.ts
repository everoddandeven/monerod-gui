import { Peer } from "./Peer";
import { Span } from "./Span";

export class SyncInfo {
    public readonly height: number;
    public readonly targetHeight: number;
    public readonly nextNeededPruningSeed: number;
    public readonly overview: string;
    public readonly peers: Peer[];
    public readonly spans: Span[];

    constructor(height: number, targetHeight: number, nextNeededPruningSeed: number, overview: string, peers: Peer[], spans: Span[]) {
        this.height = height;
        this.targetHeight = targetHeight;
        this.nextNeededPruningSeed = nextNeededPruningSeed;
        this.overview = overview;
        this.peers = peers;
        this.spans = spans;
    }

    public static parse(syncInfo: any): SyncInfo {
        const height: number = syncInfo.height;
        const targetHeight: number = syncInfo.target_height;
        const nextNeededPruningSeed: number = syncInfo.next_needed_pruning_seed;
        const overview: string = syncInfo.overview;
        const peers: Peer[] = [];
        const spans: Span[] = [];
        const rawPeers: any[] = syncInfo.peers;
        const rawSpans: any[] | undefined = syncInfo.spans;

        if (rawPeers) rawPeers.forEach((peer: any) => peers.push(Peer.parse(peer)));
        if (rawSpans) rawSpans.forEach((span: any) => spans.push(Span.parse(span)));

        return new SyncInfo(height, targetHeight, nextNeededPruningSeed, overview, peers, spans);
    }

}