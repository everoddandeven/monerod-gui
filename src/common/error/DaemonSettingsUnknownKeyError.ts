import { DaemonSettingsError } from "./DaemonSettingsError"

export class DaemonSettingsUnkownKeyError extends DaemonSettingsError {
    public key: string;

    constructor(key: string) {
        super(`Unknown daemon setting <strong>${key}</strong>`);

        this.key = key;
    }
}