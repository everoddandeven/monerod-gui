import { Injectable, NgZone } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MoneroInstallerService {
  private _upgrading: boolean = false;
  private _progress: { progress: number, status: string } = { progress: 0, status: 'Starting upgrade' }

  public get upgrading(): boolean {
    return this._upgrading;
  }

  public get progress(): { progress: number, status: string } {
    return this._progress;
  }

  constructor(private ngZone: NgZone) {}

  public async downloadMonero(downloadUrl: string, destination: string): Promise<string> {
    this._upgrading = true;
    
    try {
      const result = await new Promise<string>((resolve, reject) => {
        const wdw = (window as any);
  
        if (wdw.electronAPI && wdw.electronAPI.onDownloadProgress && wdw.electronAPI.downloadMonerod) {
          wdw.electronAPI.onDownloadProgress((event: any, progress: { progress: number, status: string }) => {
            //console.log(`${progress.progress.toFixed(2)} % ${progress.status}`);
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
  
          wdw.electronAPI.downloadMonerod(downloadUrl, destination);
        }
      });

      this._upgrading = false;
      return result;
    }
    catch (error) {
      console.error(error);
      this._upgrading = false;

      throw error;
    }

  }
}
