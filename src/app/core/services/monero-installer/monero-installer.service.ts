import { Injectable } from '@angular/core';
import { ElectronService } from '../electron/electron.service';

@Injectable({
  providedIn: 'root'
})
export class MoneroInstallerService {
  constructor(private electronService: ElectronService) {}

  public downloadMonero(downloadUrl: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.electronService.ipcRenderer.invoke('download-monero', downloadUrl, destination)
        .then(() => resolve())
        .catch((error) => reject(error));

      this.electronService.ipcRenderer.on('download-progress', (event, { progress, status }) => {
        console.log(`Progress: ${progress}% - ${status}`);
        // Qui puoi aggiornare lo stato di progresso nel tuo componente
      });
    });
  }
}
