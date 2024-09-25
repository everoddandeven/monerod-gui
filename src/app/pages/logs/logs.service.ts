import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import { ElectronService } from '../../core/services';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  public readonly onLog: EventEmitter<string> = new EventEmitter<string>();
  public readonly lines: string[] = [];

  constructor(private electronService: ElectronService, private ngZone: NgZone) {
    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer.on('monero-stdout', (event, message: string) => this.log(message));
      this.electronService.ipcRenderer.on('monero-stderr', (event, message: string) => this.log(message));
    }
    
  }

  public log(message: string): void {
    this.ngZone.run(() => {
      this.lines.push(message);
      this.onLog.emit(message);
    });

  }
}
