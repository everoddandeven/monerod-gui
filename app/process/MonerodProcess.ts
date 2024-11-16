import { AppChildProcess } from "./AppChildProcess";

export class MonerodProcess extends AppChildProcess {

    protected static readonly stdoutPattern: string = '**********************************************************************';

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

    public static async isValidMonerodPath(monerodPath: string): Promise<boolean> {
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
                console.log(`MonerodProcess.isValidMonerodPath(): '${err.message}'`);
                resolve(false);
            });

            proc.onStdErr((err: string) => {
                console.log(`MonerodProcess.isValidMonerodPath(): '${err}'`);
                resolve(false);
            });

            proc.onStdOut((data: string) => {
                if (foundUsage) {
                    return;
                }

                console.log(`MonerodProcess.isValidMonerodPath(): '${data}'`);

                if (
                    `${data}`.includes('monerod [options|settings] [daemon_command...]') ||
                    `${data}`.includes('monerod.exe [options|settings] [daemon_command...]')
                ) {
                    foundUsage = true;
                }
            });

            proc.onClose((code: number | null) => {
                console.log(`MonerodProcess.isValidMonerodPath(): exit code '${code}', found usage: ${foundUsage}`);
                resolve(foundUsage);
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
            const validPath = await MonerodProcess.isValidMonerodPath(this._command);

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

        const patternPromise = new Promise<void>((resolve, reject) => {
            let firstStdout = true;
            let timeout: NodeJS.Timeout | undefined = undefined;

            const onStdOut = (out: string) => {
                if (firstStdout) {
                    firstStdout = false;
                    timeout = setTimeout(() => {
                        if (this._process && this._process.exitCode == null) {
                            this._process.kill();
                        }
                        timeout = undefined;
                        reject(new Error("Timeout out"));
                    }, 90*1000);
                }

                const foundPattern = out.includes(MonerodProcess.stdoutPattern);

                if (!foundPattern) {
                    return;
                }

                if (firstPatternFound) {
                    if(timeout !== undefined) clearTimeout(timeout);
                    resolve();
                }
                else {
                    firstPatternFound = true;
                }
            };

            this.onStdOut(onStdOut);
        });

        await super.start();

        if (!this._process || !this._process.pid) {
            throw new Error("Monerod process did not start!");
        }
        try {
            const waitForPattern = this._args ? !this._args.includes('--version') && !this.args.includes('--help') : true;
            
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
                console.log("proc.onError():");
                console.error(err);
                reject(err)
            });
            
            proc.onStdErr((err: string) => {
                console.log("proc.onStdErr()");
                console.error(err);
                reject(new Error(err));
            });

            proc.onStdOut((version: string) => {
                console.log("proc.onStdOut():");
                console.log(version);
                resolve(version);
            });
        });

        console.log("Before proc.start()");
        await proc.start();
        console.log("After proc.start()");

        return await promise;
    }

}