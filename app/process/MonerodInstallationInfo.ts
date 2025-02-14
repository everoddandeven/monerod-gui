import { InstallationInfo } from "./InstallationInfo";

export interface MonerodInstallationInfo extends InstallationInfo { 
  configFile?: string; 
  pidFile?: string; 
  isRunning?: boolean; 
};
