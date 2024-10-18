import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { LogCategories } from '../../../common';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  public readonly onLog: EventEmitter<string> = new EventEmitter<string>();
  public readonly lines: string[] = [];
  public readonly maxLines: number = 250;
  public readonly categories: LogCategories = new LogCategories();

  constructor(private ngZone: NgZone) {
    window.electronAPI.onMoneroStdout((event: any, message: string) => {
      this.log(message);
    });
  }

  public cleanLog(message: string): string {
    return message.replace(/\u001b\[[0-9;]*m/g, '').replace(/[\r\n]+/g, '\n').trim(); // eslint-disable-line
  }

  public log(message: string): void {
    this.ngZone.run(() => {
      if (this.lines.length <= this.maxLines) {
        this.lines.push(this.cleanLog(message));
      }
      else {
        this.lines.shift();
        this.lines.push(this.cleanLog(message));
      }
      this.onLog.emit(this.cleanLog(message));
    });

  }
}
