import { AfterContentInit, AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { LogsService } from './logs.service';
import { NavbarPill } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services';
import { LogCategories } from '../../../common';
import { BasePageComponent } from '../base-page/base-page.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-logs',
    templateUrl: './logs.component.html',
    styleUrl: './logs.component.scss',
    standalone: false
})
export class LogsComponent extends BasePageComponent implements AfterViewInit, AfterContentInit, OnDestroy {
  private logsService = inject(LogsService);
  private daemonService = inject(DaemonService);

  private initing: boolean = false;
  private scrollEventsRegistered: boolean = false;
  
  public setLogLevelLevel: number = 0;
  public settingLogLevel: boolean = false;
  public setLogLevelError: string = '';
  public setLogLevelSuccess: boolean = false;

  public settingLogCategories: boolean = false;
  public setLogCategoriesError: string = '';
  public setLogCategoriesSuccess: boolean = false;

  public setLogHashRateEnabled: boolean = false;
  public settingLogHashRate: boolean = false;
  public setLogHashRateError: string = '';
  public setLogHashRateSuccess: boolean = false;

  public scrolling: boolean = false;

  private readonly scrollHandler: (ev: Event) => void = (ev: Event) => {
    this.scrolling = ev.type === 'scroll';
  };
  
  public get setLogCategoriesCategories(): LogCategories {
    return this.logsService.categories;
  }
  
  private readonly monerodLink: NavbarPill = new NavbarPill('overview', 'monerod', false, true);

  constructor() {
    super();

    const onLogSub: Subscription = this.logsService.onLog.subscribe(({ type } : { message: string; type: 'monerod' | 'i2pd'; }) => {
      this.onLog(type);
    });

    const links = [
      this.monerodLink,
      new NavbarPill('set-log-level', 'Set Log Level'),
      new NavbarPill('set-log-categories', 'Set Log Categories'),
      new NavbarPill('set-log-hash-rate', 'Set Log Hash Rate')
    ];

    this.setLinks(links);

    this.subscriptions.push(onLogSub);
  }

  public get lines(): string[] {
    return this.logsService.logs.monerod;
  }

  public get logs(): string {
    return this.initing ? '' : this.lines.join("\n");
  }

  private onLog(type: 'monerod' | 'i2pd' | 'tor'): void {
    if (this.scrolling || type !== 'monerod') return;

    this.scrollTableContentToBottom(`${type}-log-table`);
  }

  private registerScrollEvents(): void {
    if (this.scrollEventsRegistered) {
      console.warn("Scroll events already registered");
      return;
    }

    const tabs = this.getTableContents();

    tabs.forEach((tab) => {
      tab.addEventListener('scroll', this.scrollHandler);
      tab.addEventListener('scrollend', this.scrollHandler);
    });

    this.scrollEventsRegistered = true;
  }

  private getTableContents(): HTMLElement[] {
    const table1 = document.getElementById('monerod-log-table');
    const result: HTMLElement[] = [];

    if (table1) result.push(table1);

    return result;
  }

  private unregisterScrollEvents(): void {
    if (!this.scrollEventsRegistered) {
      console.warn("Scroll events already unregistered");
      return;
    }

    const tabs = this.getTableContents();

    tabs.forEach((tab) => {
      if (!tab) {
        console.warn("Coult not find table content");
        return;
      }
  
      tab.removeEventListener('scroll', this.scrollHandler);
      tab.removeEventListener('scrollend', this.scrollHandler);
    });

    this.scrollEventsRegistered = false;
  }

  public trackByFn(index: number, item: string): number {
    console.debug(`trackByFn(index: ${index}, ${item})`);
    return index;  // usa l'indice per tracciare gli elementi
  }

  public clearMonerodLogs(): void {
    this.logsService.clear('monerod');
  }

  public async setLogLevel(): Promise<void> {
    this.settingLogLevel = true;

    try {
      await this.daemonService.setLogLevel(this.setLogLevelLevel);

      this.setLogLevelError = '';
      this.setLogLevelSuccess = true;
    } catch (error: any) {
      this.setLogLevelSuccess = false;
      this.setLogLevelError = `${error}`;

      console.error(error);
    }

    this.settingLogLevel = false;
  }

  public async setLogHashRate(): Promise<void> {
    this.settingLogHashRate = true;

    try {
      await this.daemonService.setLogHashRate(this.setLogHashRateEnabled);
      this.setLogHashRateError = '';
      this.setLogHashRateSuccess = true;
    } catch(error: any) {
      console.error(error);
      this.setLogHashRateError = `${error}`;
      this.setLogHashRateSuccess = false;
    }

    this.settingLogHashRate = false;
  }

  public async setLogCategories(): Promise<void> {
    this.settingLogCategories = true;

    try
    {
      const categories = this.setLogCategoriesCategories.toString();

      await this.daemonService.setLogCategories(categories);
      
      this.setLogCategoriesError = ``;
      this.setLogCategoriesSuccess = true;
    }
    catch(error: any) {
      this.setLogCategoriesError = `${error}`;
      this.setLogCategoriesSuccess = false;
    }

    this.settingLogCategories = false;
  }

  public override updateTablesContentHeight(): void {
    super.updateTablesContentHeight();
  }

  public scrollTablesContentToBottom(): void {
    this.scrollTableContentToBottom('pills-tabContent');
  }

  public ngAfterViewInit(): void {
    this.initing = true;  
    setTimeout(() => {
      this.registerScrollEvents();
      this.scrollTablesContentToBottom();
      this.initing = false;
      
      setTimeout(() => {
        this.scrollTablesContentToBottom();
      }, 500);
    }, 500);  
  }

  public override ngOnDestroy(): void {
    this.unregisterScrollEvents();
    super.ngOnDestroy();
  }
}

