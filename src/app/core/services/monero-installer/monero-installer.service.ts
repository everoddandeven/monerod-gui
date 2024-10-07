import { Injectable } from '@angular/core';
import { ElectronService } from '../electron/electron.service';

@Injectable({
  providedIn: 'root'
})
export class MoneroInstallerService {
  constructor(private electronService: ElectronService) {}

  public downloadMonero(downloadUrl: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.electronService.isElectron) {
        this.electronService.ipcRenderer.invoke('download-monero', downloadUrl, destination)
        .then(() => resolve())
        .catch((error) => reject(error));

        this.electronService.ipcRenderer.on('download-progress', (event, { progress, status }) => {
          console.log(`Progress: ${progress}% - ${status}`);
          // Qui puoi aggiornare lo stato di progresso nel tuo componente
        });
      }
      else {
        const wdw = (window as any);

        if (wdw.electronAPI && wdw.electronAPI.onDownloadProgress && wdw.electronAPI.downloadMonerod) {
          wdw.electronAPI.onDownloadProgress((event: any, progress: any) => {
            console.log(`Download progress: ${progress}`);
          });

          wdw.electronAPI.downloadMonerod(downloadUrl, destination);
        }
      }

    });
  }
}
