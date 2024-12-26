import { DaemonSettingsError } from "./DaemonSettingsError";

export abstract class DaemonSettingsDuplicateNodeError extends DaemonSettingsError {
    public node: string;
    public type: string;

    constructor(node: string, type: string) {
        super(`${type} node ${node} already added`);

        this.node = node;
        this.type = type;
    }
}