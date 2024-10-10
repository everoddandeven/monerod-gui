import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { DaemonDataService, DaemonService } from '../../core/services';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { Chart, ChartData } from 'chart.js/auto'
import { NetStatsHistoryEntry } from '../../../common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrl: './network.component.scss'
})
export class NetworkComponent implements AfterViewInit, OnDestroy {
  public readonly navbarLinks: NavbarLink[];

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

  private subscriptions: Subscription[] = [];

  constructor(private navbarService: NavbarService, private daemonService: DaemonService, private daemonData: DaemonDataService) {
    this.navbarLinks = [
      new NavbarLink('pills-net-stats-tab', '#pills-net-stats', 'pills-net-stats', false, 'Statistics'),
      new NavbarLink('pills-connections-tab', '#pills-connections', 'connections', false, 'Connetions'),
      new NavbarLink('pills-limits-tab', '#pills-limit', 'pills-limit', false, 'Limit')
    ];

    this.subscriptions.push(this.daemonData.netStatsRefreshEnd.subscribe(() => {
      this.refreshNetStatsHistory();
    }));

    this.subscriptions.push(this.daemonData.syncEnd.subscribe(() => {
      this.loadConnectionsTable();
    }));

    this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
      if (!running) {
        if (this.netStatsBytesInChart) {
          this.netStatsBytesInChart.destroy();
          this.netStatsBytesInChart = undefined;
        }
      }
    });
  }

  public ngAfterViewInit(): void {
    this.navbarService.setLinks(this.navbarLinks);
    this.initNetStatsHistoryChart();
    this.initConnectionsTable();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });

    this.subscriptions = [];
  }

  private initConnectionsTable(): void {
    const $table = $('#connectionsTable');
    $table.bootstrapTable({});
    $table.bootstrapTable('refreshOptions', {
      classes: 'table table-bordered table-hover table-dark table-striped'
    });
  }

  private loadConnectionsTable(): void {
    const $table = $('#connectionsTable');

    $table.bootstrapTable('load', this.daemonData.connections);
  }

  private buildChartBytesInData(): ChartData {
    const labels: string [] = [];
    const data: number[] = [];
    this.daemonData.netStatsHistory.history.forEach((entry: NetStatsHistoryEntry) => {
      labels.push(`${entry.date.toLocaleTimeString()} ${entry.date.toLocaleDateString()}`);
      data.push(entry.netStats.totalBytesIn);
    });

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'transparent',
        borderColor: '#007bff',
        borderWidth: 4,
        pointBackgroundColor: '#007bff'
      }]
    };
  }

  private buildChartBytesOutData(): ChartData {
    const labels: string [] = [];
    const data: number[] = [];
    this.daemonData.netStatsHistory.history.forEach((entry: NetStatsHistoryEntry) => {
      labels.push(`${entry.date.toLocaleTimeString()} ${entry.date.toLocaleDateString()}`);
      data.push(entry.netStats.totalBytesOut);
    });

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'transparent',
        borderColor: '#007bff',
        borderWidth: 4,
        pointBackgroundColor: '#007bff'
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
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            boxPadding: 3
          }
        }
      }
    });

    this.netStatsBytesOutChart = new Chart(ctx2, {
      type: 'line',
      data: this.buildChartBytesOutData(),
      options: {
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            boxPadding: 3
          }
        }
      }
    });

    this.netStatsBytesInChart.update();
    this.netStatsBytesOutChart.update();
  }

  private refreshNetStatsHistory(): void {
    if (!this.netStatsBytesInChart) {
      return;
    }

    const last = this.daemonData.netStatsHistory.last;

    if (!this.netStatsBytesInChart || !this.netStatsBytesOutChart) {
      this.initNetStatsHistoryChart();
    }
    else if (last) {
      const label = `${last.date.toLocaleTimeString()} ${last.date.toLocaleDateString()}`;
      
      this.netStatsBytesInChart.data.labels?.push(label);
      this.netStatsBytesInChart.data.datasets.forEach((dataset) => {
        dataset.data.push(last.netStats.totalBytesIn);
      });

      this.netStatsBytesOutChart.data.labels?.push(label);
      this.netStatsBytesOutChart.data.datasets.forEach((dataset) => {
        dataset.data.push(last.netStats.totalBytesOut);
      });

      this.netStatsBytesInChart.update();
      this.netStatsBytesOutChart.update();
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
}