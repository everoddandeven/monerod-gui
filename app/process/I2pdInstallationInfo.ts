import { InstallationInfo } from "./InstallationInfo";

export interface I2pdInstallationInfo extends InstallationInfo { configFile?: string; tunnelConfig?: string; tunnelsConfigDir?: string; pidFile?: string; isRunning?: boolean; };
