
export class MainData {
  uptime: string = '';
  networkStatus: string = '';
  tunnelCreationSuccessRate: string = '';
  received: string = '';
  sent: string = '';
  transit: string = '';
  dataPath: string = '';
  routerIdent: string = '';
  routerCaps: string = '';
  version: string = '';
  ourExternalCaps: { type: string; address: string; }[] = [];
  routers: string = '';
  clientTunnels: number = 0;
  transitTunnels: number = 0;
  services: {
    httpProxy: boolean;
    socksProxy: boolean;
    bob: boolean;
    same: boolean;
    i2cp: boolean;
    i2pControl: boolean;
  } = {
    httpProxy: false,
    socksProxy: false,
    bob: false,
    same: false,
    i2cp: false,
    i2pControl: false
  };

  public static fromContent(content: string): MainData {
    const components = content.split('\n').filter((c) => c !== '');
    const result = new MainData();
    
    let constructingExternalAddresses: boolean = false;
    let lastExternalAddress: { type: string; address: string; } | undefined = undefined;

    components.forEach((component) => {
      if (component.includes('Uptime')) {
        result.uptime = component.replace('Uptime: ', '');
      }
      else if (component.includes('Network status')) {
        result.networkStatus = component.replace('Network status: ', '');
      }
      else if (component.includes('Tunnel creation success rate')) {
        result.tunnelCreationSuccessRate = component.replace('Tunnel creation success rate: ', '');
      }
      else if (component.includes('Received')) {
        result.received = component.replace('Received: ', '');
      }
      else if (component.includes('Sent')) {
        result.sent = component.replace('Sent: ', '');
      }
      else if (component.includes('Transit')) {
        result.transit = component.replace('Transit: ', '');
      }
      else if (component.includes('Data path')) {
        result.dataPath = component.replace('Data path: ', '');
      }
      else if (component.includes('Router Ident')) {
        result.routerIdent = component.replace('Router Ident: ', '');
      }
      else if (component.includes('Router Caps')) {
        result.routerCaps = component.replace('Router Caps: ', '');
      }
      else if (component.includes('Version')) {
        result.version = component.replace('Version: ', '');
      }
      else if (component.includes('Our external address')) {
        constructingExternalAddresses = true;
        return;
      }
      else if (component.includes('Routers')) {
        result.routers = component.replace('Routers: ', '');
      }
      else if (component.includes('Client Tunnels')) {
        const v = component.replace('Client Tunnels: ', 'Transit Tunnels: ').split(' ');
        const v0 = Number(v[0]);
        const v1 = Number(v[1]);

        result.clientTunnels = (!isNaN(v0)) ? v0 : 0;
        result.transitTunnels = (!isNaN(v1)) ? v1 : 0;
      }
      else if (component.includes('HTTP Proxy')) {
        result.services.httpProxy = component.replace('HTTP Proxy', '') == 'Enabled';
      }
      else if (component.includes('SOCKS Proxy')) {
        result.services.socksProxy = component.replace('SOCKS Proxy', '') == 'Enabled';
      }
      else if (component.includes('BOB')) {
        result.services.bob = component.replace('BOB', '') == 'Enabled';
      }
      else if (component.includes('I2CP')) {
        result.services.i2cp = component.replace('I2CP', '') == 'Enabled';
      }
      else if (component.includes('I2PControl')) {
        result.services.bob = component.replace('I2PControl', '') == 'Enabled';
      }
      else if (constructingExternalAddresses) {
        if (lastExternalAddress) {
          lastExternalAddress.address = component;
          result.ourExternalCaps.push(lastExternalAddress);
          lastExternalAddress = undefined;
        }
        else {
          lastExternalAddress = { type: component, address: '' };
        }

        return;
      }

      constructingExternalAddresses = false;
    });

    return result;
  }

  public static fromWrapper(wrapper: HTMLDivElement): MainData {
    for(let i = 0; i < wrapper.children.length; i++) {
      const element = wrapper.children.item(i);

      if (!element) continue;

      if (element.className === 'content') {
        return this.fromElement(element as HTMLElement);
      }
    }

    throw new Error("content not found");
  }

  public static fromElement(element: HTMLElement): MainData {
    return (!element.textContent) ? new MainData() : this.fromContent(element.textContent);
  }

}