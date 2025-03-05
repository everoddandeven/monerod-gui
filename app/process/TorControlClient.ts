import { TorControl } from 'tor-ctrl';
export type TorControlCommand = 'authenticate' | 'getVersion' | 'getCircuitStatus' | 'getNetworkStatus' | 'changeIdentity' | 'reload' | 'getBootstrapPhase' | 'getCircuitEstablished';

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

      await this.ctrl.disconnect();
    }
    catch (error: any) {
      res.error = error instanceof Error ? error.message : `${error}`;
    }

    return res;
  }

}

// === Esempio di utilizzo ===
/*
(async () => {
  const torClient = new TorControlClient(9051, null); // Usa null per autenticazione via cookie
  const authenticated = await torClient.authenticate();

  if (authenticated) {
    console.log(await torClient.getVersion());
    console.log(await torClient.getCircuitStatus());
    console.log(await torClient.changeIdentity());
  }
})();
*/
