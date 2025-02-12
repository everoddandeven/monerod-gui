import * as os from 'os';
import { exec, ExecException } from "child_process";
import { powerMonitor } from "electron";

const batteryLevel = require('battery-level');

export abstract class BatteryUtils {
  
  public static async isOnBatteryPower(): Promise<boolean> {

    const onBattery = powerMonitor.isOnBatteryPower();

    if (!onBattery && os.platform() == 'linux') {

      return await new Promise<boolean>((resolve) => {
        exec("upower -i $(upower -e | grep 'battery') | grep 'state'", (error: ExecException | null, stdout: string) => {
          if (error) {
            console.error(`isOnBatteryPower(): ${error.message}`);
            resolve(false);
            return;
          }

          const isOnBattery = stdout.includes("discharging");
          resolve(isOnBattery);
        });
      });
    }

    return onBattery;
  }

  public static async getLevel(): Promise<number> {
    try {
      return batteryLevel();
    }
    catch(error: any) {
      console.error(error);
      return -1;
    }
  }
}