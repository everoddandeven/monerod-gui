import { DaemonSettingsDuplicateNodeError } from "./DaemonSettingsDuplicateNodeError";

export class DaemonSettingsDuplicateExclusiveNodeError extends DaemonSettingsDuplicateNodeError {

    constructor(node: string) {
        super(node, "exclusive");
    }
}