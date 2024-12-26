import { DaemonSettingsDuplicateNodeError } from "./DaemonSettingsDuplicateNodeError";

export class DaemonSettingsDuplicatePriorityNodeError extends DaemonSettingsDuplicateNodeError {

    constructor(node: string) {
        super(node, "priority");
    }
}