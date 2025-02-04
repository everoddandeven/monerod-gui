import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { DaemonDataService, DaemonService } from '../../core/services';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { Chart, ChartData } from 'chart.js/auto'
import { Connection, NetStats, NetStatsHistoryEntry } from '../../../common';
import { Subscription } from 'rxjs';
import { BasePageComponent } from '../base-page/base-page.component';

@Component({
    selector: 'app-network',
    templateUrl: './network.component.html',
    styleUrl: './network.component.scss',
    standalone: false
})
export class NetworkComponent extends BasePageComponent implements AfterViewInit, OnDestroy {

  private connections?: Connection[];
  private netStatsBytesInChart?: Chart;
  private netStatsBytesOutChart?: Chart;

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonData.stopping;
  }

  public limiting: boolean = false;
  public limitUp: number = 0;
  public limitDown: number = 0;
  public setLimitResult?: { limitUp: number, limitDown: number };
  public setLimitSuccess: boolean = false;
  public setLimitError: string = '';

  public currentNetStats: NetStats;
  public getConnectionsError: string = '';
  public refreshingConnectionsTable: boolean = false;

  constructor(navbarService: NavbarService, private daemonService: DaemonService, private daemonData: DaemonDataService) {
    super(navbarService);
    this.setLinks([
      new NavbarLink('pills-net-stats-tab', '#pills-net-stats', 'pills-net-stats', false, 'Statistics'),
      new NavbarLink('pills-connections-tab', '#pills-connections', 'connections', false, 'Connetions'),
      new NavbarLink('pills-limits-tab', '#pills-limit', 'pills-limit', false, 'Limit')
    ]);

    const lastNetStats = this.daemonData.netStatsHistory.last;
    this.currentNetStats = lastNetStats ? lastNetStats.netStats : new NetStats(0, 0, 0, 0);

    const netStatsRefreshStartSub: Subscription = this.daemonData.netStatsRefreshEnd.subscribe(() => {
      this.refreshNetStatsHistory();
    });

    const daemonStatusSub: Subscription = this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      if (!running) {
        if (this.netStatsBytesInChart) {
          this.netStatsBytesInChart.destroy();
          this.netStatsBytesInChart = undefined;
        }
        if (this.netStatsBytesOutChart) {
          this.netStatsBytesOutChart.destroy();
          this.netStatsBytesOutChart = undefined;
        }

        this.destroyTables();
      }
      else {
        this.initNetStatsHistoryChart();
        this.loadConnectionsTable();
      }
    });

    this.subscriptions.push(netStatsRefreshStartSub, daemonStatusSub);
  }

  public ngAfterViewInit(): void {
    this.initNetStatsHistoryChart();
    this.refreshConnectionsTable().then().catch((error: any) => console.error(error));
  }

  public async refreshConnectionsTable(): Promise<void> {
    if (!await this.daemonService.isRunning()) {
      return;
    }
    
    this.refreshingConnectionsTable = true;

    try {
      this.connections = await this.daemonService.getConnections();
    }
    catch(error: any) {
      console.error(error);
      this.connections = undefined;
    }

    this.loadConnectionsTable();
    this.refreshingConnectionsTable = false;
  }

  private loadConnectionsTable(): void {
    this.loadTable('connectionsTable', this.connections ? this.connections : [], this.connections === undefined && this.getConnectionsError == '');
  }

  private buildChartBytesInData(): ChartData {
    const labels: string [] = [];
    const data: number[] = [];
    this.daemonData.netStatsHistory.history.forEach((entry: NetStatsHistoryEntry) => {
      labels.push(`${entry.date.toLocaleTimeString()} ${entry.date.toLocaleDateString()}`);
      data.push(entry.netStats.totalGigaBytesIn);
    });

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'transparent',
        borderColor: '#ff5733',
        borderWidth: 4,
        pointBackgroundColor: '#ff5733',
        radius: 0
      }]
    };
  }

  private buildChartBytesOutData(): ChartData {
    const labels: string [] = [];
    const data: number[] = [];
    this.daemonData.netStatsHistory.history.forEach((entry: NetStatsHistoryEntry) => {
      labels.push(`${entry.date.toLocaleTimeString()} ${entry.date.toLocaleDateString()}`);
      data.push(entry.netStats.totalGigaBytesOut);
    });

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'transparent',
        borderColor: '#ff5733',
        borderWidth: 4,
        pointBackgroundColor: '#ff5733',
        radius: 0
      }]
    };
  }

  private initNetStatsHistoryChart(): void {
    const ctx1 = <HTMLCanvasElement>document.getElementById('netStatsBytesInChart');
    const ctx2 = <HTMLCanvasElement>document.getElementById('netStatsBytesOutChart');

    if (!ctx1 || !ctx2) {
      return;
    }

    this.netStatsBytesInChart = new Chart(ctx1, {
      type: 'line',
      data: this.buildChartBytesInData(),
      options: {
        animation: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            boxPadding: 3
          },
          decimation: {
            enabled: true,
            algorithm: 'min-max'
          }
        }
      }
    });

    this.netStatsBytesOutChart = new Chart(ctx2, {
      type: 'line',
      data: this.buildChartBytesOutData(),
      options: {
        animation: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            boxPadding: 3
          },
          decimation: {
            enabled: true,
            algorithm: 'min-max'
          }
        }
      }
    });

    this.netStatsBytesInChart.update();
    this.netStatsBytesOutChart.update();
  }

  private refreshNetStatsHistory(): void {
    const last = this.daemonData.netStatsHistory.last;

    if (!this.netStatsBytesInChart || !this.netStatsBytesOutChart) {
      this.initNetStatsHistoryChart();
    }
    else if (last) {
      const label = `${last.date.toLocaleDateString()} ${last.date.toLocaleTimeString()}`;
      
      this.netStatsBytesInChart.data.labels?.push(label);
      this.netStatsBytesInChart.data.datasets.forEach((dataset) => {
        dataset.data.push(last.netStats.totalGigaBytesIn);
      });

      this.netStatsBytesOutChart.data.labels?.push(label);
      this.netStatsBytesOutChart.data.datasets.forEach((dataset) => {
        dataset.data.push(last.netStats.totalGigaBytesOut);
      });

      this.netStatsBytesInChart.update();
      this.netStatsBytesOutChart.update();
      this.currentNetStats = last.netStats;
    }
  }

  public async setLimit(): Promise<void> {
    this.limiting = true;

    try {
      this.setLimitResult = await this.daemonService.setLimit(this.limitUp, this.limitDown);
      this.setLimitSuccess = true;
      this.setLimitError = '';
    } 
    catch (error: any) {
      console.error(error);
      this.setLimitResult = undefined;
      this.setLimitSuccess = false;
      this.setLimitError = `${error}`;
    }

    this.limiting = false;
  }

  public override ngOnDestroy(): void {
    if (this.netStatsBytesInChart) {
      this.netStatsBytesInChart.destroy();
    }
    if (this.netStatsBytesOutChart) {
      this.netStatsBytesOutChart.destroy();
    }

    super.ngOnDestroy();
  }
}