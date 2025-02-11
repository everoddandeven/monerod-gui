import { execSync } from "child_process";
import { AppChildProcess } from "./AppChildProcess";
import * as fs from 'fs';

export class I2pdProcess extends AppChildProcess {

    constructor({ i2pdPath, flags, isExe }: { i2pdPath: string, flags?: string[], isExe?: boolean }) {
        super({
            command: i2pdPath,
            args: flags,
            isExe: isExe
        });
    }

    public override async start(): Promise<void> {
        let message: string = "Starting i2pd process";

        message += `\n\t${this._isExe ? 'Path' : 'Command'}: ${this._command}`;

        if (this._args) {
            message += `\n\tFlags: ${this._args.join(" ")}`
        }

        await super.start();
    }

    static async isValidPath(executablePath: string): Promise<boolean> {
        // Verifica se il file esiste
        if (!fs.existsSync(executablePath)) {
            return false;
        }

        // Verifica se il file è un eseguibile (su Linux)
        try {
            const stats = fs.statSync(executablePath);
            if (!stats.isFile()) {
                return false;
            }

            // Prova a eseguire una versione del comando per ottenere l'output
            const output = execSync(`${executablePath} --version`).toString();
            if (output.includes("i2pd")) {
                return true;
            }
        } catch (err) {
            return false;
        }

        return false;
    }


}