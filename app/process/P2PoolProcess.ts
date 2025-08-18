import { exec } from "child_process";
import { AppChildProcess } from "./AppChildProcess";

export class P2PoolProcess extends AppChildProcess {

  protected static readonly stdoutPattern: string = `monitor thread ready`;

  constructor({ cmd, flags, isExe }: { cmd: string, flags?: string[], isExe?: boolean }) {
    super({
      command: cmd,
      args: flags,
      isExe: isExe
    })
  }

  public static async isValidPath(p2poolPath: string): Promise<boolean> {
    console.log(`P2PoolProcess.isValidP2PoolPath('${p2poolPath}')`);

    if (typeof p2poolPath !== 'string' || P2PoolProcess.replaceAll(p2poolPath, " ", "") == "") {
      return false;
    }

    try {
      P2PoolProcess.checkExecutable(p2poolPath);
    }
    catch {
      return false;
    }

    const proc = new AppChildProcess({
      command: p2poolPath,
      args: [ '--help' ],
      isExe: true
    });

    const promise = new Promise<boolean>((resolve) => {
      let foundUsage: boolean = false;

      proc.onError((err: Error) => {
        console.log(`P2PoolProcess.isValidP2PoolPath(): Error: '${err.message}'`);
        resolve(false);
      });

      proc.onStdErr((err: string) => {
        console.log(`P2PoolProcess.isValidP2PoolPath(): Std Error: '${err}'`);
        resolve(false);
      });

      proc.onStdOut((data: string) => {
        if (foundUsage) {
          return;
        }

        if (`${data}`.includes('P2Pool')) {
          foundUsage = true;
        }
      });

      proc.onClose((code: number | null) => {
        console.log(`P2PoolProcess.isValidP2PoolPath(): exit code '${code}', found usage: ${foundUsage}`);
        resolve(foundUsage && code == 0);
      });
    });

    try {
      await proc.start();
    }
    catch(error: any) {
      console.log(`P2PoolProcess.isValidP2PoolPath(): exit code '${error}'`);
    }

    return await promise;
  }

  public override async start(): Promise<void> {
    if (this._isExe) {
      const validPath = await P2PoolProcess.isValidPath(this._command);

      if (!validPath) {
        throw new Error("Invalid p2pool path provided: " + this._command);
      }
    }

    let message: string = "Starting p2pool process";

    message += `\n\t${this._isExe ? 'Path' : 'Command'}: ${this._command}`;

    if (this._args) {
      message += `\n\tFlags: ${this._args.join(" ")}`
    }
  
    console.log(message);

    const waitForPattern = this._args ? !this._args.includes('--version') && !this.args.includes('--help') : true;

    const patternPromise = new Promise<void>((resolve, reject) => {
      let firstStdout = true;
      let timeout: NodeJS.Timeout | undefined = undefined;
      let error: any = null;

      const onStdOut = (out: string) => {
        console.log(out);
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

            reject(new Error("P2PoolProcess.start(): Timed out"));
          }, 60*1000);
        }

        const foundPattern = out.includes(P2PoolProcess.stdoutPattern);

        if (!foundPattern) {
          return;
        }

        if(timeout !== undefined) {
          clearTimeout(timeout);
          console.log("P2PoolProcess.start(): Cleared timeout");
        }
        else {
          console.log("P2PoolProcess.start(): No timeout found");
        }
        
        resolve();
      };

      const onStdErr = (out: string) => {
        console.log('Std Err: ', out);
        const c = out.split(' ');
        c.shift();
        c.shift();

        error = c.join(' ');
      }

      const onError = (err: any) => {
        console.log('onError: ', err);
        error = err;
      }

      const onClose = (code: number | null) => {
        if (timeout) {
          clearTimeout(timeout);
          if (error) reject(new Error(`${error}`));
          else reject("P2Pool closed unexpectedly: code " + code);
        }
      };

      if (waitForPattern) {
        this.onStdOut(onStdOut);
        this.onStdErr(onStdErr);
        this.onError(onError);
        this.onClose(onClose);
      }
      else resolve();
    });

    await super.start(false);

    if (waitForPattern) await this.wait(1000);

    if (!this._process || !this._process.pid || !this._running) {
      throw new Error("P2Pool process did not start!");
    }
    try {            
      console.log(`P2PoolProcess.start(): wait for pattern: ${waitForPattern}`);

      if (waitForPattern) await patternPromise;

      console.log("Started p2pool process pid: " + this._process.pid);    
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

  public override _stop(): void {
    console.log("\n\n\nKILLING P2POOL!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\n\n");
    exec('pkill p2pool');
  }

  public async getVersion(): Promise<string> {
    const proc = new P2PoolProcess({
      cmd: this._command,
      flags: [ '--version' ],
      isExe: this._isExe
    });

    const promise = new Promise<string>((resolve, reject) => {
      proc.onError((err: Error) => {
        console.log("P2PoolProcess.getVersion(): proc.onError():");
        console.error(err);
        reject(err)
      });
      
      proc.onStdErr((err: string) => {
        console.log("P2PoolProcess.getVersion(): proc.onStdErr()");
        console.error(err);
        reject(new Error(err));
      });

      proc.onStdOut((version: string) => {
        if (version == '') {
          return;
        }

        console.log("P2PoolProcess.getVersion(): proc.onStdOut():");
        console.log(version);
        resolve(version);
      });
    });

    console.log("P2PoolProcess.getVersion(): Before proc.start()");
    await proc.start();
    console.log("P2PoolProcess.getVersion(): After proc.start()");

    return await promise;
  }

}