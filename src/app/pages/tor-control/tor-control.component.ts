import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { BasePageComponent } from '../base-page/base-page.component';
import { NavbarLink } from '../../shared/components';
import { DaemonService, TorBootstrapPhase, TorDaemonService } from '../../core/services';
import { ProcessStats } from '../../../common';

@Component({
  selector: 'app-tor-control',
  templateUrl: './tor-control.component.html',
  styleUrl: './tor-control.component.scss',
  standalone: false
})
export class TorControlComponent extends BasePageComponent implements AfterViewInit, OnDestroy {
  private torService = inject(TorDaemonService);
  private daemonService = inject(DaemonService);


  public get running(): boolean {
    return this.torService.running;
  }
  
  public get starting(): boolean {
    return this.torService.starting;
  }

  public get stopping(): boolean {
    return this.torService.stopping || this.daemonService.stopping;
  }

  public get enabled(): boolean {
    return this.torService.settings.enabled;
  }

  public get alertIcon(): string {
    if (!this.enabled) return 'bi bi-exclamation-diamond m-4';
    return 'bi bi-stop-fill m-4';
  }

  public _uptime: number = 0;

  public get uptime(): string {
    const elapsedMilliseconds = this._uptime * 1000;

    const seconds = Math.floor((elapsedMilliseconds / 1000) % 60);
    const minutes = Math.floor((elapsedMilliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(elapsedMilliseconds / (1000 * 60 * 60));
    
    const uptime = {
      hours: hours < 10 ? `0${hours}` : `${hours}`,
      minutes: minutes < 10 ? `0${minutes}` : `${minutes}`,
      seconds: seconds < 10 ? `0${seconds}` : `${seconds}`
    };

    return `${uptime.hours}:${uptime.minutes}:${uptime.seconds}`;
  }

  public get alertTitle(): string {
    if (this.starting) return "Starting TOR Service";
    if (this.stopping) return "Stopping TOR Service";
    if (!this.enabled) return "TOR Service disabled";
    else if (!this.running) return "TOR Service not running";
    return "";
  }

  public get alertMessage(): string {
    if (this.starting) return "TOR Service is starting";
    if (this.stopping) return "TOR Service is shutting down gracefully";
    if (!this.enabled) return "Enable TOR in daemon settings";
    else if (!this.running) return "Start monero daemon to active TOR service";
    return "";
  }

  public networkStatus: any = '';

  public circuitEstablished: boolean = false;
  public bootstrapPhase: TorBootstrapPhase = new TorBootstrapPhase('NOTICE');

  public sent: number = 0;
  public received: number = 0;

  private refreshing: boolean = false;
  private refreshInterval?: NodeJS.Timeout;

  private _processStats: ProcessStats = {
    cpu: 0,
    memory: 0,
    ppid: 0,
    pid: 0,
    ctime: 0,
    elapsed: 0,
    timestamp: 0
  };

  public get processStats(): ProcessStats {
    return this._processStats;
  }

  public get cpuUsage(): string {
    return `${this.processStats.cpu.toFixed(2)}%`;
  }

  public get ramUsage(): string {
    return `${(this.processStats.memory / 1024 / 1024).toFixed(2)} MB`;
  }

  private readonly refreshHandler: () => void = () => this.refresh();
  
  constructor() {
    super();

    const links = [
      new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', true, 'Overview', false, false),
      new NavbarLink('pills-commands-tab', '#pills-commands', 'pills-commands', true, 'Commands')
    ];

    this.setLinks(links);

    if (this.torService.running) this.startLoop();

    const onStart = this.torService.onStart.subscribe(() => {
      if (this.refreshInterval === undefined) this.startLoop();
    });

    const onStop = this.torService.onStop.subscribe(() => {
      if (this.refreshInterval !== undefined) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = undefined;
      }
    });

    this.subscriptions.push(onStart, onStop);
  }

  public ngAfterViewInit(): void {
    this.refresh().catch((error: any) => console.error(error));
  }

  private async refresh(): Promise<void> {
    if (this.refreshing || this.starting || this.stopping || !this.running) return;

    this.refreshing = true;

    try {
      this.circuitEstablished = await this.torService.getCircuitEstablished();
      this.bootstrapPhase = await this.torService.getBootstrapPhase();
      this._uptime = await this.torService.getUptime();
      const trafficInfo = await this.torService.getTrafficInfo();

      this.sent = parseFloat((trafficInfo.sent / 1024).toFixed(2));
      this.received = parseFloat((trafficInfo.received / 1024).toFixed(2));
      this._processStats = await this.torService.getProcessStats();
    }
    catch (error: any) {
      console.error(error);
    }

    this.refreshing = false;
  }

  private resetProcessStats(): void {
    this._processStats = {
      cpu: 0,
      memory: 0,
      ppid: 0,
      pid: 0,
      ctime: 0,
      elapsed: 0,
      timestamp: 0
    };
  }

  private startLoop() {
    if (this.refreshInterval !== undefined) throw new Error("loop already started");
    this.resetProcessStats();
    this.refresh().then(() => {
      this.refreshInterval = setInterval(this.refreshHandler, 5000);
    }).catch((error: any) => console.error(error));
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();

    if (this.refreshInterval === undefined) return;
    clearInterval(this.refreshInterval);
  }

  // #region Commands 

  public get reloading(): boolean {
    return this.torService.reloading;
  }

  public async reload(): Promise<void> {
    try {
      const result = await this.torService.reload();
      console.log('reload tor result: ', result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  public get changingIdentity(): boolean {
    return this.torService.changingIdentity;
  }

  public async changeIdentity(): Promise<void> {
    try {
      const result = await this.torService.changeIdentity();
      console.log('change identity tor result: ', result);
    }
    catch (error: any) {
      console.error(error);
    }
  }

  public async clearDnsCache(): Promise<void> {
    try {
      const result = await this.torService.clearDnsCache();
      console.log('clear dns cache tor result: ', result);
    }
    catch (error: any) {
      console.error(error);
    }
  }
  // #endregion
}
