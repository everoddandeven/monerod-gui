import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
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
  styleUrl: './logs.component.scss'
})
export class LogsComponent extends BasePageComponent implements AfterViewInit, OnDestroy {
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

  private readonly mScrollHandler: (ev: Event) => void = (ev: Event) => {
    this.scrolling = ev.type === 'scroll';
  };
  
  public get setLogCategoriesCategories(): LogCategories {
    return this.logsService.categories;
  }
  
  constructor(navbarService: NavbarService, private logsService: LogsService, private daemonService: DaemonService, private ngZone: NgZone) {
    super(navbarService);

    const onLogSub: Subscription = this.logsService.onLog.subscribe((message: string) => {
      console.debug(message);
      this.onLog()
    });

    this.setLinks([
      new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', false, 'Overview'),
      new NavbarLink('pills-set-log-level-tab', '#pills-set-log-level', 'pills-set-log-level', false, 'Set Log Level'),
      new NavbarLink('pills-set-log-categories-tab', '#pills-set-log-categories', 'pills-set-log-categories', false, 'Set Log Categories'),
      new NavbarLink('pills-set-log-hash-rate-tab', '#pills-set-log-hash-rate', 'pills-set-log-hash-rate', false, 'Set Log Hash Rate')
    ]);

    this.subscriptions.push(onLogSub);
  }

  public get lines(): string[] {
    return this.logsService.lines;
  }

  public get logs(): string {
    return this.initing ? '' : this.lines.join("\n");
  }

  private onLog(): void {
    if (this.scrolling) return;

    this.scrollTableContentToBottom();
  }

  private registerScrollEvents(): void {
    if (this.scrollEventsRegistered) {
      console.warn("Scroll events already registered");
      return;
    }

    const tab = this.getTableContent();

    if (!tab) {
      console.warn("Coult not find table content");
      return;
    }

    tab.addEventListener('scroll', this.mScrollHandler);
    tab.addEventListener('scrollend', this.mScrollHandler);
  }

  private unregisterScrollEvents(): void {
    if (!this.scrollEventsRegistered) {
      console.warn("Scroll events already unregistered");
      return;
    }

    const tab = this.getTableContent();

    if (!tab) {
      console.warn("Coult not find table content");
      return;
    }

    tab.removeEventListener('scroll', this.mScrollHandler);
    tab.removeEventListener('scrollend', this.mScrollHandler);
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

  public ngAfterViewInit(): void {
    this.initing = true;  
    setTimeout(() => {
      this.registerScrollEvents();
      this.scrollTableContentToBottom();
      this.initing = false;
      
      setTimeout(() => {
        this.scrollTableContentToBottom();
      }, 500);
    }, 500);  
  }

  public override ngOnDestroy(): void {
    this.unregisterScrollEvents();
    super.ngOnDestroy();
  }
}

