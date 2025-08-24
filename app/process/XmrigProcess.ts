import { AppChildProcess, sudo } from "./AppChildProcess";

export class XmrigProcess extends AppChildProcess {

  protected static readonly stdoutPattern: string = `READY`;

  constructor({ cmd, flags, isExe }: { cmd: string, flags?: string[], isExe?: boolean }) {
    super({
      command: cmd,
      args: flags,
      isExe: isExe,
      admin: true
    })
  }

  public static async isValidPath(xmrigPath: string): Promise<boolean> {
    console.log(`XmrigProcess.isValidXmrigPath('${xmrigPath}')`);

    if (typeof xmrigPath !== 'string' || XmrigProcess.replaceAll(xmrigPath, " ", "") == "") {
      return false;
    }

    try {
      XmrigProcess.checkExecutable(xmrigPath);
    }
    catch {
      return false;
    }

    const proc = new AppChildProcess({
      command: xmrigPath,
      args: [ '--help' ],
      isExe: true
    });

    const promise = new Promise<boolean>((resolve) => {
      let foundUsage: boolean = false;

      proc.onError((err: Error) => {
        console.log(`XmrigProcess.isValidXmrigPath(): Error: '${err.message}'`);
        resolve(false);
      });

      proc.onStdErr((err: string) => {
        console.log(`XmrigProcess.isValidXmrigPath(): Std Error: '${err}'`);
        resolve(false);
      });

      proc.onStdOut((data: string) => {
        if (foundUsage) {
          return;
        }

        if (`${data}`.includes('Usage: xmrig [OPTIONS]')) {
          foundUsage = true;
        }
      });

      proc.onClose((code: number | null) => {
        console.log(`XmrigProcess.isValidXmrigPath(): exit code '${code}', found usage: ${foundUsage}`);
        resolve(foundUsage && code == 0);
      });
    });

    try {
      await proc.start();
    }
    catch(error: any) {
      console.log(`XmrigProcess.isValidXmrigPath(): exit code '${error}'`);
    }

    return await promise;
  }

  public override async start(): Promise<void> {
    if (this._isExe) {
      const validPath = await XmrigProcess.isValidPath(this._command);

      if (!validPath) {
        throw new Error("Invalid xmrig path provided: " + this._command);
      }
    }

    let message: string = "Starting xmrig process";

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
      let foundPattern: boolean = false;

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

            reject(new Error("XmrigProcess.start(): Timed out"));
          }, 60*1000);
        }

        foundPattern = out.includes(XmrigProcess.stdoutPattern);

        if (!foundPattern) {
          return;
        }

        if(timeout !== undefined) {
          clearTimeout(timeout);
          console.log("XmrigProcess.start(): Cleared timeout");
        }
        else {
          console.log("XmrigProcess.start(): No timeout found");
        }
        
        resolve();
      };

      const onStdErr = (out: string) => {
        console.log('XmrigProcess.StdErr: ', out);
        error = out;
      }

      const onError = (err: any) => {
        console.log('onError: ', err);
        error = err;
      }

      const onClose = (code: number | null) => {
        if (timeout) {
          console.log('XmrigProcess.onClose(): clearing timeout, error: ' + error);
          clearTimeout(timeout);
          if (error) reject(new Error(`${error}`));
          else reject("Xmrig closed unexpectedly: code " + code);
        } else if (!foundPattern) reject(new Error(error ? error : 'An unkown error occured while starting xmrig'));
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
      throw new Error("Xmrig process did not start!");
    }
    try {            
      console.log(`XmrigProcess.start(): wait for pattern: ${waitForPattern}`);

      if (waitForPattern) await patternPromise;

      console.log("Started xmrig process pid: " + this._process.pid);    
    }
    catch(error: any) {      
      console.log(`XmrigProcess.start(): error occured while waiting for start: ${error}`)      
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

  public async stop(): Promise<number | null> {
    if (this._starting) {
      throw new Error("Process is starting");
    }

    if (this._stopping) {
      throw new Error("Process is already stopping");
    }

    const proc = this._process;

    if (!this._running || !proc) {
      throw new Error("Process is not running");
    }

    this._stopping = true;

    const promise = new Promise<number | null>((resolve) => {
      proc.on('close', (code: number | null) => {
        this._process = undefined;
        this._running = false;
        this._stopping = false;
        resolve(code);
      });
      proc.on('exit', (code: | number) => {
        this._process = undefined;
        this._running = false;
        this._stopping = false;
        resolve(code);
      });
    });

    const result = await sudo.exec('pkill xmrig');

    if (result.stderr) console.log("LOG XMRIG: " + result.stdout);
    if (result.stderr) console.log("ERROR KILLING XMRIG: " + result.stderr);

    return await promise;
  }

  public async getVersion(): Promise<string> {
    const proc = new XmrigProcess({
      cmd: this._command,
      flags: [ '--version' ],
      isExe: this._isExe
    });

    const promise = new Promise<string>((resolve, reject) => {
      proc.onError((err: Error) => {
        console.log("XmrigProcess.getVersion(): proc.onError():");
        console.error(err);
        reject(err)
      });
      
      proc.onStdErr((err: string) => {
        console.log("XmrigProcess.getVersion(): proc.onStdErr()");
        console.error(err);
        reject(new Error(err));
      });

      proc.onStdOut((version: string) => {
        if (version == '') {
          return;
        }

        console.log("XmrigProcess.getVersion(): proc.onStdOut():");
        console.log(version);
        resolve(version);
      });
    });

    console.log("XmrigProcess.getVersion(): Before proc.start()");
    await proc.start();
    console.log("XmrigProcess.getVersion(): After proc.start()");

    return await promise;
  }

}