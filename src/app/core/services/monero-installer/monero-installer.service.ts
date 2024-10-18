import { Injectable, NgZone } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MoneroInstallerService {
  private readonly resources = {
    win32: 'https://downloads.getmonero.org/cli/win32',
    win64: 'https://downloads.getmonero.org/cli/win64',
    mac64: 'https://downloads.getmonero.org/cli/mac64',
    macarm8: 'https://downloads.getmonero.org/cli/macarm8',
    linux32: 'https://downloads.getmonero.org/cli/linux32',
    linux64: 'https://downloads.getmonero.org/cli/linux64',
    linuxarm7: 'https://downloads.getmonero.org/cli/linuxarm7',
    linuxarm8: 'https://downloads.getmonero.org/cli/linuxarm8',
    linuxriscv64: 'https://downloads.getmonero.org/cli/linuxriscv64'
  };

  private _progress: { progress: number, status: string } = { progress: 0, status: 'Starting upgrade' }

  private alreadyConfigured: boolean = false;

  public get upgrading(): boolean {
    return this._downloading && this.alreadyConfigured;
  }

  public get installing(): boolean {
    return this._downloading && !this.alreadyConfigured;
  }

  private _downloading: boolean = false;

  public get progress(): { progress: number, status: string } {
    return this._progress;
  }

  constructor(private ngZone: NgZone) {}

  public async downloadMonero(destination: string, alreadyConfigured: boolean): Promise<string> {
    this.alreadyConfigured = alreadyConfigured;
    this._downloading = true;
    const downloadUrl = await this.getMoneroDownloadLink();
    
    try {
      const result = await new Promise<string>((resolve, reject) => {

        window.electronAPI.onDownloadProgress((event: any, progress: { progress: number, status: string }) => {

          this.ngZone.run(() => {
            this._progress = progress;
          });

          if (progress.status.includes('Error')) {
            reject(progress.status);
          }

          if (progress.progress == 200) {
            resolve(progress.status);
          }

        });

        window.electronAPI.downloadMonerod(downloadUrl, destination);
      });

      this._downloading = false;
      return result;
    }
    catch (error) {
      console.error(error);
      this._downloading = false;

      throw error;
    }
  }

  private async getMoneroDownloadLink(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      window.electronAPI.gotOsType((event: any, osType: { platform: string, arch: string }) => {
        const platform = osType.platform;
        const arch = osType.arch;
        let resource: string = '';

        // Mappatura tra sistema operativo e architettura
        if (platform === 'win32') {
          resource = arch === 'x64' ? this.resources.win64 : this.resources.win32;
        } else if (platform === 'darwin') {
          resource = arch === 'arm64' ? this.resources.macarm8 : this.resources.mac64;
        } 
        else if (platform === 'linux') {
          if (arch === 'x64') {
            resource = this.resources.linux64;
          } 
          else if (arch === 'ia32') {
            resource = this.resources.linux32;
          } 
          else if (arch === 'arm') {
            resource = this.resources.linuxarm7;
          } 
          else if (arch === 'arm64') {
            resource = this.resources.linuxarm8;
          } 
          else if (arch === 'riscv64') {
            resource = this.resources.linuxriscv64;
          }
        }
        if (resource != '')
        {
          resolve(resource);
        }
        
        reject('Unsopported platform ' + platform);
      });

      window.electronAPI.getOsType();
    });


    
  }
}
