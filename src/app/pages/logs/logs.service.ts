import { EventEmitter, Injectable, NgZone, inject } from '@angular/core';
import { LogCategories } from '../../../common';
import { I2pDaemonService, TorDaemonService } from '../../core/services';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private ngZone = inject(NgZone);
  private i2pService = inject(I2pDaemonService);
  private torService = inject(TorDaemonService);

  
  private readonly torLogHandler: (message: string) => void = (message: string) => {
    this.log(message, 'tor');
  }

  private readonly i2pdLogHandler: (message: string) => void = (message: string) => {
    this.log(message, 'i2pd');
  }

  private readonly monerodLogHandler: (message: string) => void = (message: string) => {
    this.log(message, 'monerod');
  }

  public readonly onLog: EventEmitter<{ message: string, type: 'monerod' | 'i2pd' | 'tor' }> = new EventEmitter<{ message: string, type: 'monerod' | 'i2pd' | 'tor' }>();
  public readonly logs: {
    monerod: string[];
    i2pd: string[];
    tor: string[];
  } = {
    monerod: [],
    i2pd: [],
    tor: []
  }
  public readonly maxLines: number = 250;
  public readonly categories: LogCategories = new LogCategories();
  
  constructor() {
    window.electronAPI.onMonerodStdout(this.monerodLogHandler);
    this.i2pService.std.out.subscribe(this.i2pdLogHandler);
    this.i2pService.std.err.subscribe(this.i2pdLogHandler);
    this.torService.std.out.subscribe(this.torLogHandler);
    this.torService.std.err.subscribe(this.torLogHandler);
  }

  public cleanLog(message: string): string {
    return message.replace(/\u001b\[[0-9;]*m/g, '').replace(/[\r\n]+/g, '\n').trim(); // eslint-disable-line
  }

  public clear(program: 'monerod' | 'i2pd' | 'tor'): void {
    if (program === 'monerod') {
      this.logs.monerod = [];
    }
    else if (program === 'i2pd') {
      this.logs.i2pd = [];
    }
    else if (program === 'tor') {
      this.logs.tor = [];
    }
  }

  public log(message: string, type: 'monerod' | 'i2pd' | 'tor'): void {
    const lines = type === 'monerod' ? this.logs.monerod : type === 'tor' ? this.logs.tor : this.logs.i2pd;
    
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
