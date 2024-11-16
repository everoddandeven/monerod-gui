import { exec, ExecException } from 'child_process';
import * as os from 'os';
const network = require('network');

export abstract class NetworkUtils {
    public static isConnectedToWiFi(): Promise<boolean> {
        try {
      
          return new Promise<boolean>((resolve, reject) => {
            network.get_active_interface((err: any | null, obj: { name: string, ip_address: string, mac_address: string, type: string, netmask: string, gateway_ip: string }) => {
              if (err) {
                console.error(err);
                reject(err);
              }
              else {
                resolve(obj.type == 'Wireless');
              }
            })
          });
        }
        catch(error: any) {
          return this.isConnectedToWiFiNative();
        }
      }
      
      private static isConnectedToWiFiNative(): Promise<boolean> {
        return new Promise((resolve, reject) => {
          const platform = os.platform();  // Use os to get the platform
      
          let command = '';
          if (platform === 'win32') {
            // Windows: Use 'netsh' command to check the Wi-Fi status
            command = 'netsh wlan show interfaces';
          } else if (platform === 'darwin') {
            // macOS: Use 'airport' command to check the Wi-Fi status
            command = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep 'state: running'";
          } else if (platform === 'linux') {
            // Linux: Use 'nmcli' to check for Wi-Fi connectivity
            command = 'nmcli dev status';
          } else {
            resolve(false);  // Unsupported platform
          }
      
          // Execute the platform-specific command
          if (command) {
            exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
              if (error) {
                console.error(error);
                reject(stderr);
                resolve(false);  // In case of error, assume not connected to Wi-Fi
              } else {
                // Check if the output indicates a connected status
                if (stdout) {
                  const components: string[] = stdout.split("\n");
      
                  components.forEach((component: string) => {
                    if (component.includes('wifi') && !component.includes('--')) {
                      resolve(true);
                    }
                  });
      
                  resolve(false);
                } else {
                  resolve(false);
                }
              }
            });
          }
        });
      }
}