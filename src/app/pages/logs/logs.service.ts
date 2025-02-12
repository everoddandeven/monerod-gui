import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { LogCategories } from '../../../common';
import { I2pDaemonService } from '../../core/services';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private readonly i2pdLogHandler: (message: string) => void = (message: string) => {
    this.log(message, 'i2pd');
  }

  private readonly monerodLogHandler: (event: any, message: string) => void = (event: any, message: string) => {
    this.log(message, 'monerod');
  }

  public readonly onLog: EventEmitter<{ message: string, type: 'monerod' | 'i2pd' }> = new EventEmitter<{ message: string, type: 'monerod' | 'i2pd' }>();
  public readonly logs: {
    monerod: string[];
    i2pd: string[];
  } = {
    monerod: [],
    i2pd: []
  }
  public readonly maxLines: number = 250;
  public readonly categories: LogCategories = new LogCategories();
  
  constructor(private ngZone: NgZone, private i2pService: I2pDaemonService) {
    window.electronAPI.onMoneroStdout(this.monerodLogHandler);
    this.i2pService.std.out.subscribe(this.i2pdLogHandler);
    this.i2pService.std.err.subscribe(this.i2pdLogHandler);
  }

  public cleanLog(message: string): string {
    return message.replace(/\u001b\[[0-9;]*m/g, '').replace(/[\r\n]+/g, '\n').trim(); // eslint-disable-line
  }

  public log(message: string, type: 'monerod' | 'i2pd'): void {
    const lines = type === 'monerod' ? this.logs.monerod : this.logs.i2pd;
    
    this.ngZone.run(() => {
      message = this.cleanLog(message);

      if (lines.length <= this.maxLines) {
        lines.push(this.cleanLog(message));
      }
      else {
        lines.shift();
        lines.push(this.cleanLog(message));
      }
      
      this.onLog.emit({ message, type });
    });

  }
}
