import { TorControl } from 'tor-ctrl';
export type TorControlCommand = 'authenticate' | 'getVersion' | 'getCircuitStatus' | 'getNetworkStatus' | 'changeIdentity' | 'reload' | 'getBootstrapPhase' | 'getCircuitEstablished' | 'getUptime' | 'getTrafficInfo' | 'shutdown' | 'clearDnsCache';

export class TorControlClient {
  private controlPort: number;
  private password?: string;
  private ctrl: TorControl;

  public get authenticationRequired(): boolean {
    return this.password !== null;
  }

  constructor(port: number = 9051, password?: string) {
    this.controlPort = port;
    this.password = password;
    this.ctrl = new TorControl({
      host: '127.0.0.1',
      port,
      password
    });
  }

  public async invokeCommand(cmd: TorControlCommand): Promise<{ result?: any; error?: string; }> {
    const res: { result?: any; error?: string; } = { };

    try {
      const sr = await this.ctrl.connect();
      
      if (sr.error) throw sr.error;

      if (cmd === 'authenticate') {
        if (!this.password) res.error = 'Password not set';
        else res.result = (await this.ctrl.authenticate(this.password)).data;
      }
      else if (cmd === 'getVersion') {
        res.result = (await this.ctrl.getInfo('version')).data?.message;
      }
      else if (cmd === 'getCircuitStatus') {
        res.result = (await this.ctrl.getInfo('circuit-status')).data?.message;
      }
      else if (cmd === 'getCircuitEstablished') {
        res.result = (await this.ctrl.getInfo('status/circuit-established')).data?.message;
      }
      else if (cmd === 'getNetworkStatus') {
        res.result = (await this.ctrl.getInfo('ns/all')).data?.message;
      }
      else if (cmd === 'changeIdentity') {
        res.result = (await this.ctrl.getNewIdentity()).data?.message;
      }
      else if (cmd === 'getBootstrapPhase') {
        const phase = await this.ctrl.getInfo('status/bootstrap-phase');
        res.result = phase.data?.message;
      }
      else if (cmd === 'getUptime') {
        const uptime = await this.ctrl.getInfo('uptime');
        res.result = uptime.data?.message;
      }
      else if (cmd === 'reload') {
        res.result = await this.ctrl.signalReload();
      }
      else if (cmd === 'shutdown') {
        res.result = await this.ctrl.signalShutdown();
      }
      else if (cmd === 'clearDnsCache') {
        res.result = await this.ctrl.signalClearDnsCache();
      }
      else if (cmd === 'getTrafficInfo') {
        const read = await this.ctrl.getInfo('traffic/read');
        const written = await this.ctrl.getInfo('traffic/written');

        let sent = 0;
        let received = 0;

        if (read.data) {
          try {
            const v = read.data.message.split('=');

            if (v.length !== 2) throw new Error();

            received = parseInt(v[1]);
          }
          catch {}
        }

        if (written.data) {
          try {
            const v = written.data.message.split('=');

            if (v.length !== 2) throw new Error();
            
            sent = parseInt(v[1]);
          }
          catch {}
        }

        res.result = { sent, received };
      }

      await this.ctrl.disconnect();
    }
    catch (error: any) {
      res.error = error instanceof Error ? error.message : `${error}`;
    }

    return res;
  }

}
