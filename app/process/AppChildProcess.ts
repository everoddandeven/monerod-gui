import * as fs from 'fs';
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { ProcessStats } from './ProcessStats';


const pidusage = require('pidusage');

export class AppChildProcess {

    protected _starting: boolean = false;
    protected _stopping: boolean = false;
    protected _running: boolean = false;
    protected _isExe: boolean = true;

    protected _process?: ChildProcessWithoutNullStreams;
    
    protected _command: string;
    protected readonly _args?: string[];

    public get pid(): number {
        if (!this._process || this._process.pid == null) {
            return -1;
        }

        return this._process.pid;
    }

    protected readonly _handlers: {
        'stdout': ((data: string) => void)[],
        'stderr': ((err: string) => void)[],
        'onclose': ((code: number | null) => void)[],
        'onerror': ((error: Error) => void)[],
    } = {
        'stdout': [],
        'stderr': [],
        'onclose': [],
        'onerror': []
    };

    private readonly mOnErrorDefaultHandler: (error: Error) => void = (error: Error) => {
        if (!this._process) {
            return;
        }

        const listeners = this._process.listeners('error');
        
        if (listeners.length > 1) {
            return;
        }

        console.error("Uncaught exeception: ");
        console.error(error);
    };

    public get command(): string {
        return this._command;
    }

    public get args(): string[] {
        return this._args ? this._args : [];
    }

    public get running(): boolean {
        return this._running;
    }

    constructor({ command, args, isExe } : { command: string, args?: string[], isExe?: boolean}) {
        this._command = command;
        this._args = args;
        this._isExe = isExe === false ? false : true;
    }

    protected static replaceAll(value: string, oldValue: string, newValue: string): string {
        let v = value;

        while(v.includes(oldValue)) {
            v = v.replace(oldValue, newValue);
        }

        return v;
    }

    protected static checkExecutable(executablePath: string): void {
        const exeComponents: string[] = executablePath.split(" ").filter((c) => c != '');
        console.log("AppProcess.checkExecutable(): " + executablePath);
        if (exeComponents.length == 0) {
            throw new Error("Invalid command provided");
        }

        const exePath = exeComponents[0];

        if (!fs.existsSync(exePath)) {
            throw new Error("Cannot find executable: " + exePath);
        }
    }
    
    protected checkExecutable(): void {
        AppChildProcess.checkExecutable(this.command);
    }

    public onStdOut(callback: (out: string) => void): void {
        const cbk = (chunk: any) => callback(`${chunk}`);

        if (!this._process) {
            this._handlers.stdout.push(cbk);
            return;
        }

        this._process.stdout.on('data', cbk);
    }

    public onStdErr(callback: (err: string) => void): void {
        const cbk = (chunk: any) => callback(`${chunk}`);

        if (!this._process) {
            this._handlers.stderr.push(cbk);
            return;
        }

        this._process.stderr.on('data', cbk);
    }

    public onError(callback: (err: Error) => void): void {
        if (!this._process)
        {
            this._handlers.onerror.push(callback);
            return;
        }

        this._process.on('error', callback);
    }

    public onClose(callback: (code: number | null) => void): void {
        if (!this._process) {
            this._handlers.onclose.push(callback);
            return;
        }

        this._process.on('close', callback);
    }

    public async start(): Promise<void> {
        if (this._starting) {
            throw new Error("Process is already starting");
        }

        if (this._stopping) {
            throw new Error("Process is stopping");
        }

        if (this._running) {
            throw new Error("Process already running");
        }

        if (this._isExe) {
            this.checkExecutable();
        }

        this._starting = true;

        const process = spawn(this._command, this._args);
        this._process = process;

        const promise = new Promise<void>((resolve, reject) => {
            const onSpawnError = (err: Error) => {
                this._starting = false;
                this._running = false;
                reject(err);
            };

            const onSpawn = () => {
                this._starting = false;
                this._running = true;
                process.off('error', onSpawnError);
                process.on('error', this.mOnErrorDefaultHandler);

                this._handlers.onclose.forEach((listener) => process.on('close', listener));
                this._handlers.onerror.forEach((listener) => process.on('error', listener));
                this._handlers.stdout.forEach((listener) => process.stdout.on('data', listener));
                this._handlers.stderr.forEach((listener) => process.stderr.on('data', listener));
                
                resolve();
            };

            process.once('error', onSpawnError);
            process.once('spawn', onSpawn);
        });

        process.once('close', () => {
            if (this._stopping) return;

            this._running = false;
            this._process = undefined;
        });

        await promise;
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

        const promise = new Promise<number | null>((resolve, reject) => {
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

        if (!proc.kill()) {
            throw new Error("Could not kill monerod process: " + proc.pid);
        }

        return await promise;
    }

    public async getStats(): Promise<ProcessStats> {
        if (!this._process) {
            throw new Error("Process not running");
        }

        const pid = this._process.pid;
        
        if (!pid) {
            throw new Error("Process is unknown");
        }

        return await new Promise<ProcessStats>((resolve, reject) => {
            pidusage(pid, (err: Error | null, stats: ProcessStats) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(stats);
                }
            });
        });
    }

}