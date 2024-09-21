export class Ban {
    public readonly host: string;
    public readonly ip: number;
    public readonly ban: boolean;
    public readonly seconds: number;

    constructor(host: string, ip: number, ban: boolean, seconds: number) {
        this.host = host;
        this.ip = ip;
        this.ban = ban;
        this.seconds = seconds;
    }

    public toDictionary(): { [key: string]: any} {
        return {
            'host': this.host,
            'ip': this.ip,
            'ban': this.ban,
            'seconds': this.seconds
        }
    }

    public static parse(ban: any): Ban {
        const host = ban.host;
        const ip = ban.ip;
        const seconds = ban.seconds;
        
        return new Ban(host, ip, true, seconds);
    }
}
