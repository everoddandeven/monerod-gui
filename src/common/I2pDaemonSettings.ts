export interface I2pTunnelConfig {
    type: string,
    address: string,
    port: number
};

export interface I2pTunnel extends I2pTunnelConfig {
    name: string;
};

export interface I2pNetworkConfig { 
    enabled: boolean; 
    address: string; 
    port: number; 
};

export class I2pDaemonSettings {
    public syncOnClearNet: boolean = true;
    public allowIncomingConnections: boolean = true;
    public txProxyEnabled: boolean = true;
    public enabled: boolean = false;
    public path: string = "";
    public loglevel: string = "info";
    public ipv4: boolean = true;
    public ipv6: boolean = false;
    public floodfill: boolean = false;
    public bandwidth: string = "X";
    public http: I2pNetworkConfig = { enabled: true, address: "127.0.0.1", port: 7070 };
    public socks: I2pNetworkConfig = { enabled: true, address: "127.0.0.1", port: 4447 };
    public i2cp: I2pNetworkConfig = { enabled: true, address: "127.0.0.1", port: 7654 };
    public tunnels: I2pTunnel[] = [];
    public createHiddenService: boolean = true;  // Nuova proprietà per gestire il hidden service
    public hiddenServicePort: number = 80;

    public static parse(settings: any): I2pDaemonSettings {
        const result = new I2pDaemonSettings();

        return result;
    }

    constructor() {
    }

    public addTunnel(name: string, tunnelConfig: I2pTunnelConfig): void {
        this.tunnels.push({ name, ...tunnelConfig });
    }

    public toFlags(): string[] {
        const flags: string[] = [];
        
        if (this.loglevel) {
            flags.push(`--loglevel=${this.loglevel}`);
        }
        if (this.ipv4) {
            flags.push('--ipv4');
        }
        if (this.ipv6) {
            flags.push('--ipv6');
        }
        if (this.floodfill) {
            flags.push('--floodfill');
        }
        if (this.bandwidth) {
            flags.push(`--bandwidth=${this.bandwidth}`);
        }

        if (this.http.enabled) {
            flags.push(`--http.address=${this.http.address}`);
            flags.push(`--http.port=${this.http.port}`);
        }

        if (this.socks.enabled) {
            flags.push(`--socks.address=${this.socks.address}`);
            flags.push(`--socks.port=${this.socks.port}`);
        }

        if (this.i2cp.enabled) {
            flags.push(`--i2cp.address=${this.i2cp.address}`);
            flags.push(`--i2cp.port=${this.i2cp.port}`);
        }

        if (this.createHiddenService) {
            const hiddenServiceTunnel = this.tunnels.find(tunnel => tunnel.name === 'hidden_service');
            if (!hiddenServiceTunnel) {
                this.addTunnel("hidden_service", {
                    type: "http",
                    address: "127.0.0.1",
                    port: this.hiddenServicePort
                });
            }
        }

        this.tunnels.forEach(tunnel => {
            flags.push(`--tunnel.${tunnel.name}.type=${tunnel.type}`);
            flags.push(`--tunnel.${tunnel.name}.address=${tunnel.address}`);
            flags.push(`--tunnel.${tunnel.name}.port=${tunnel.port}`);
        });

        return flags;
    }
}