import { DaemonSettingsError } from "./DaemonSettingsError";

export class DaemonSettingsInvalidNetworkError extends DaemonSettingsError {

    constructor() {
        super("Invalid daemon network settings");
    }
}