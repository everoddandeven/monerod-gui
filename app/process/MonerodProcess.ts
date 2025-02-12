import { AppChildProcess } from "./AppChildProcess";

export class MonerodProcess extends AppChildProcess {

  protected static readonly stdoutPattern: string = '**********************************************************************';

  public privnet: boolean = false;

  public get interactive(): boolean {
    return this.args ? !this.args.includes('--non-interactive') : true;
  }

  public get detached(): boolean {
    return this.args ? this.args.includes('--detached') : false;
  }

  constructor({ monerodCmd, flags, isExe }: { monerodCmd: string, flags?: string[], isExe?: boolean }) {
    super({
      command: monerodCmd,
      args: flags,
      isExe: isExe
    })
  }

  public static async isValidPath(monerodPath: string): Promise<boolean> {
    console.log(`MonerodProcess.isValidMonerodPath('${monerodPath}')`);

    if (typeof monerodPath !== 'string' || MonerodProcess.replaceAll(monerodPath, " ", "") == "") {
      return false;
    }

    try {
      MonerodProcess.checkExecutable(monerodPath);
    }
    catch {
      return false;
    }

    const proc = new AppChildProcess({
      command: monerodPath,
      args: [ '--help' ],
      isExe: true
    });

    const promise = new Promise<boolean>((resolve) => {
      let foundUsage: boolean = false;

      proc.onError((err: Error) => {
        console.log(`MonerodProcess.isValidMonerodPath(): Error: '${err.message}'`);
        resolve(false);
      });

      proc.onStdErr((err: string) => {
        console.log(`MonerodProcess.isValidMonerodPath(): Std Error: '${err}'`);
        resolve(false);
      });

      proc.onStdOut((data: string) => {
        if (foundUsage) {
          return;
        }

        if (
          `${data}`.includes('monerod [options|settings] [daemon_command...]') ||
          `${data}`.includes('monerod.exe [options|settings] [daemon_command...]')
        ) {
          foundUsage = true;
        }
      });

      proc.onClose((code: number | null) => {
        console.log(`MonerodProcess.isValidMonerodPath(): exit code '${code}', found usage: ${foundUsage}`);
        resolve(foundUsage && code == 0);
      });
    });

    try {
      await proc.start();
    }
    catch(error: any) {
      console.log(`MonerodProcess.isValidMonerodPath(): exit code '${error}'`);
    }

    return await promise;
  }

  public override async start(): Promise<void> {
    if (this._isExe) {
      const validPath = await MonerodProcess.isValidPath(this._command);

      if (!validPath) {
        throw new Error("Invalid monerod path provided: " + this._command);
      }
    }

    let message: string = "Starting monerod process";

    message += `\n\t${this._isExe ? 'Path' : 'Command'}: ${this._command}`;

    if (this._args) {
      message += `\n\tFlags: ${this._args.join(" ")}`
    }
  
    console.log(message);

    let firstPatternFound = false;
    const waitForPattern = this._args ? !this.privnet && !this._args.includes('--version') && !this.args.includes('--help') : true;

    const patternPromise = new Promise<void>((resolve, reject) => {
      let firstStdout = true;
      let timeout: NodeJS.Timeout | undefined = undefined;

      const onStdOut = (out: string) => {
        //console.log(out);
        if (firstStdout) {
          firstStdout = false;

          if (!waitForPattern) {
            return;
          }

          timeout = setTimeout(() => {
            if (this._process && this._process.exitCode == null) {
              this._process.kill();
            }
            timeout = undefined;

            reject(new Error("MonerodProcess.start(): Timed out"));
          }, 90*1000);
        }

        const foundPattern = out.includes(MonerodProcess.stdoutPattern);

        if (!foundPattern) {
          return;
        }

        if (firstPatternFound) {
          if(timeout !== undefined) {
            clearTimeout(timeout);
            console.log("MonerodProcess.start(): Cleared timeout");
          }
          else {
            console.log("MonerodProcess.start(): No timeout found");
          }
          
          resolve();
        }
        else {
          firstPatternFound = true;
        }
      };

      if (waitForPattern) this.onStdOut(onStdOut);
      else resolve();
    });

    await super.start();

    if (!this._process || !this._process.pid) {
      throw new Error("Monerod process did not start!");
    }
    try {            
      console.log(`MonerodProcess.start(): wait for pattern: ${waitForPattern}`);

      if (waitForPattern) await patternPromise;

      console.log("Started monerod process pid: " + this._process.pid);    
    }
    catch(error: any) {            
      this._running = false;
      this._starting = false;
      this._stopping = false;
      
      if (error instanceof Error) {
        throw error;
      }
      else {
        throw new Error(`${error}`);
      }
    }

  }

  public async getVersion(): Promise<string> {
    const proc = new MonerodProcess({
      monerodCmd: this._command,
      flags: [ '--version' ],
      isExe: this._isExe
    });

    const promise = new Promise<string>((resolve, reject) => {
      proc.onError((err: Error) => {
        console.log("MonerodProcess.getVersion(): proc.onError():");
        console.error(err);
        reject(err)
      });
      
      proc.onStdErr((err: string) => {
        console.log("MonerodProcess.getVersion(): proc.onStdErr()");
        console.error(err);
        reject(new Error(err));
      });

      proc.onStdOut((version: string) => {
        if (version == '') {
          return;
        }

        console.log("MonerodProcess.getVersion(): proc.onStdOut():");
        console.log(version);
        resolve(version);
      });
    });

    console.log("MonerodProcess.getVersion(): Before proc.start()");
    await proc.start();
    console.log("MonerodProcess.getVersion(): After proc.start()");

    return await promise;
  }

}