import { DaemonSettingsError } from "./DaemonSettingsError"

export class DaemonSettingsInvalidValueError extends DaemonSettingsError {
    public key: string;
    public value: string;

    constructor(key: string, value: string) {
        super(`Invalid value <strong>${value}</strong> for daemon setting <strong>${key}</strong>`);

        this.key = key;
        this.value = value;
    }
}