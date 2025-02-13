import { I2PData } from "./I2PData";

export interface TunnelInfo {
  name: string;
  address: string;
}

export class TunnelsData extends I2PData {
  public clients: TunnelInfo[] = [];
  public servers: TunnelInfo[] = [];

  public static fromWrapper(wrapper: HTMLElement): TunnelsData {
    const data = new TunnelsData();

    const content = wrapper.getElementsByClassName('content').item(0);

    if (!content || !content.textContent || content.textContent == '') throw new Error("content not found");

    const components = content.textContent.split('\n').filter((x) => x !== '');

    const dc = ' ⇐ ';
    const ds = ' ⇒ ';
    let clients: boolean = false;
    let servers: boolean = false;

    components.forEach((c) => {
      if (c.startsWith('Client Tunnels:')) {
        clients = true;
        servers = false;
        return;
      }
      else if (c.startsWith('Server Tunnels:')) {
        servers = true;
        clients = false;
        return;
      }

      const v = c.split(servers ? ds : dc);

      if (v.length == 2) {
        const t: TunnelInfo = { name: v[0], address: v[1] };
        if (clients) data.clients.push(t);
        else data.servers.push(t);
      }

    })

    return data;
  }
}