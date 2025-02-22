import { EventEmitter, Injectable } from '@angular/core';
import { TorDaemonSettings } from '../../../../common';

@Injectable({
  providedIn: 'root'
})
export class TorDaemonService {

  public readonly std: TorStd = { out: new EventEmitter<string>(), err: new EventEmitter<string>() };

  private _settings: TorDaemonSettings = new TorDaemonSettings();
  private _running: boolean = false;
  private _starting: boolean = false;
  private _stopping: boolean = false;
  private _restarting: boolean = false;
  private _loaded: boolean = false;
  private _logs: string[] = [];

  public get running(): boolean {
    return this._running;
  }
  
  public get starting(): boolean {
    return this._starting;
  }

  public get stopping(): boolean {
    return this._stopping;
  }

  public get restarting(): boolean {
    return this._restarting;
  }

  public get logs(): string[] {
    return this._logs;
  }

  public get settings(): TorDaemonSettings {
    return this._settings;
  }

  public get loaded(): boolean {
    return this._loaded;
  }
  
  constructor() { }
}

interface TorStd {
  out: EventEmitter<string>;
  err: EventEmitter<string>;
};