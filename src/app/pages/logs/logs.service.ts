import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import { ElectronService } from '../../core/services';
import { LogCategories } from '../../../common';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  public readonly onLog: EventEmitter<string> = new EventEmitter<string>();
  public readonly lines: string[] = [];
  public readonly categories: LogCategories = new LogCategories();
  private readonly ansiRegex: RegExp = /\u001b\[[0-9;]*m/g;

  constructor(private electronService: ElectronService, private ngZone: NgZone) {
    const wdw = (window as any);
    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer.on('monero-stdout', (event, message: string) => this.log(message));
      this.electronService.ipcRenderer.on('monero-stderr', (event, message: string) => this.log(message));
    }
    else if (wdw.electronAPI && wdw.electronAPI.onMoneroStdout) {
      wdw.electronAPI.onMoneroStdout((event: any, message: string) => {
        this.log(message);
      });
    }
    
  }

  public cleanLog(message: string): string {
    return message.replace(this.ansiRegex, '').replace(/[\r\n]+/g, '\n').trim();
  }

  public log(message: string): void {
    this.ngZone.run(() => {
      this.lines.push(this.cleanLog(message));
      this.onLog.emit(this.cleanLog(message));
    });

  }
}
