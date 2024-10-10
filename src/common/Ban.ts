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
        const host: string = ban.host;
        const ip: number = ban.ip;
        const seconds: number = ban.seconds;

        if (typeof host != 'string' || typeof ip != 'number' || typeof seconds != 'number') {
          throw new Error("Could not parse ban object");
        }

        return new Ban(host, ip, true, seconds);
    }
}
