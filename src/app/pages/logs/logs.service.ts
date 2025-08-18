import { EventEmitter, Injectable, NgZone, inject } from '@angular/core';
import { LogCategories } from '../../../common';
import { I2pDaemonService, TorDaemonService } from '../../core/services';
import { P2poolService } from '../../core/services/p2pool/p2pool.service';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private readonly ngZone = inject(NgZone);
  private readonly i2pService = inject(I2pDaemonService);
  private readonly torService = inject(TorDaemonService);
  private readonly p2poolService = inject(P2poolService);
  
  private readonly torLogHandler: (message: string) => void = (message: string) => {
    this.log(message, 'tor');
  }

  private readonly i2pdLogHandler: (message: string) => void = (message: string) => {
    this.log(message, 'i2pd');
  }

  private readonly monerodLogHandler: (message: string) => void = (message: string) => {
    this.log(message, 'monerod');
  }

  private readonly p2poolLogHandler: (message: string) => void = (message: string) => {
    this.log(message, 'p2pool');
  }

  public readonly onLog: EventEmitter<{ message: string, type: 'monerod' | 'p2pool' | 'i2pd' | 'tor' }> = new EventEmitter<{ message: string, type: 'monerod' | 'p2pool' | 'i2pd' | 'tor' }>();
  public readonly logs: {
    monerod: string[];
    i2pd: string[];
    tor: string[];
    p2pool: string[];
  } = {
    monerod: [],
    i2pd: [],
    tor: [],
    p2pool: []
  }
  public readonly maxLines: number = 250;
  public readonly categories: LogCategories = new LogCategories();
  
  constructor() {
    window.electronAPI.onMonerodStdout(this.monerodLogHandler);
    this.i2pService.std.out.subscribe(this.i2pdLogHandler);
    this.i2pService.std.err.subscribe(this.i2pdLogHandler);
    this.torService.std.out.subscribe(this.torLogHandler);
    this.torService.std.err.subscribe(this.torLogHandler);
    this.p2poolService.std.out.subscribe(this.p2poolLogHandler);
    this.p2poolService.std.err.subscribe(this.p2poolLogHandler);
  }

  public cleanLog(message: string): string {
    return message.replace(/\u001b\[[0-9;]*m/g, '').replace(/[\r\n]+/g, '\n').trim(); // eslint-disable-line
  }

  public clear(program: 'monerod' | 'p2pool' | 'i2pd' | 'tor'): void {
    if (program === 'monerod') {
      this.logs.monerod = [];
    }
    else if (program === 'i2pd') {
      this.logs.i2pd = [];
    }
    else if (program === 'tor') {
      this.logs.tor = [];
    } else if (program === 'p2pool') {
      this.logs.p2pool = [];
    }
  }

  public log(message: string, type: 'monerod' | 'p2pool' | 'i2pd' | 'tor'): void {
    const lines = type === 'monerod' ? this.logs.monerod : type === 'tor' ? this.logs.tor : type === 'p2pool' ? this.logs.p2pool : this.logs.i2pd;
    
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
