import { AfterContentInit, AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { LogsService } from './logs.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
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
  
  constructor(navbarService: NavbarService, private logsService: LogsService, private daemonService: DaemonService, private ngZone: NgZone) {
    super(navbarService);

    const onLogSub: Subscription = this.logsService.onLog.subscribe(({ type } : { message: string; type: 'monerod' | 'i2pd'; }) => {
      this.onLog(type);
    });

    const links = [
      new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', false, 'monerod'),
      new NavbarLink('pills-i2pd-tab', '#pills-i2pd', 'pills-i2pd', false, 'i2pd'),
      new NavbarLink('pills-set-log-level-tab', '#pills-set-log-level', 'pills-set-log-level', false, 'Set Log Level'),
      new NavbarLink('pills-set-log-categories-tab', '#pills-set-log-categories', 'pills-set-log-categories', false, 'Set Log Categories'),
      new NavbarLink('pills-set-log-hash-rate-tab', '#pills-set-log-hash-rate', 'pills-set-log-hash-rate', false, 'Set Log Hash Rate')
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

  public get i2pdLines(): string [] {
    return this.logsService.logs.i2pd;
  }

  public get i2pdLogs(): string {
    return this.initing ? '' : this.i2pdLines.join("\n");
  }

  private onLog(type: 'monerod' | 'i2pd'): void {
    if (this.scrolling) return;

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
    const table2 = document.getElementById('i2pd-log-table');
    const result: HTMLElement[] = [];

    if (table1) result.push(table1);
    if (table2) result.push(table2);

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

  public override ngAfterContentInit(): void {
    super.ngAfterContentInit();

    setTimeout(() => this.updateTablesContentHeight(), 100);
  }

  public override updateTablesContentHeight(): void {
    super.updateTablesContentHeight();
    //this.updateTableContentHeight('monerod-log-table');
    //this.updateTableContentHeight('i2pd-log-table');
  }

  public scrollTablesContentToBottom(): void {
    this.scrollTableContentToBottom('monerod-log-table');
    this.scrollTableContentToBottom('i2pd-log-table');
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

