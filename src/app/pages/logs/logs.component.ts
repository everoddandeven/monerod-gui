import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { LogsService } from './logs.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services';
import { LogCategories } from '../../../common';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss'
})
export class LogsComponent implements AfterViewInit {
  @ViewChild('logTerminal', { read: ElementRef }) public logTerminal?: ElementRef<any>;
  public readonly navbarLinks: NavbarLink[];
  
  public setLogLevelLevel: number = 0;
  public settingLogLevel: boolean = false;
  public setLogLevelError: string = '';
  public setLogLevelSuccess: boolean = false;

  //public readonly setLogCategoriesCategories: LogCategories = new LogCategories();
  
  public get setLogCategoriesCategories(): LogCategories {
    return this.logsService.categories;
  }
  
  public settingLogCategories: boolean = false;
  public setLogCategoriesError: string = '';
  public setLogCategoriesSuccess: boolean = false;

  public setLogHashRateEnabled: boolean = false;
  public settingLogHashRate: boolean = false;
  public setLogHashRateError: string = '';
  public setLogHashRateSuccess: boolean = false;

  constructor(private navbarService: NavbarService, private logsService: LogsService, private daemonService: DaemonService, private ngZone: NgZone) {
    this.logsService.onLog.subscribe((message: string) => this.onLog());
    this.navbarLinks = [
      new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', false, 'Overview'),
      new NavbarLink('pills-set-log-level-tab', '#pills-set-log-level', 'pills-set-log-level', false, 'Set Log Level'),
      new NavbarLink('pills-set-log-categories-tab', '#pills-set-log-categories', 'pills-set-log-categories', false, 'Set Log Categories'),
      new NavbarLink('pills-set-log-hash-rate-tab', '#pills-set-log-hash-rate', 'pills-set-log-hash-rate', false, 'Set Log Hash Rate')
    ];
  }

  public get lines(): string[] {
    return this.logsService.lines;
  }

  private scrollToBottom(): void {
    this.ngZone.run(() => {
      this.lines;
      const terminalOutput = <HTMLDivElement | null>document.getElementById('terminalOutput');
      if (terminalOutput) {
        terminalOutput.style.width = `${window.innerWidth}`;
        console.log(`scrolling from ${terminalOutput.offsetTop} to ${terminalOutput.scrollHeight}`)
        terminalOutput.scrollBy(0, terminalOutput.scrollHeight)
      }
    });
  }

  private onLog(): void {
    if (this.logTerminal) this.logTerminal.nativeElement.scrollTop = this.logTerminal.nativeElement.scrollHeight;
    // Scorri automaticamente in basso
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  public trackByFn(index: number, item: string): number {
    return index;  // usa l'indice per tracciare gli elementi
  }

  public ngAfterViewInit(): void {
    this.navbarService.setLinks(this.navbarLinks);
    
    setTimeout(() => {
      this.scrollToBottom();
    }, 500);  
  }

  public async setLogLevel(): Promise<void> {
    this.settingLogLevel = true;

    try {
      await this.daemonService.setLogLevel(this.setLogLevelLevel);

      this.setLogLevelError = '';
      this.setLogLevelSuccess = true;
    } catch (error) {
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
    } catch(error) {
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
    catch(error) {
      this.setLogCategoriesError = `${error}`;
      this.setLogCategoriesSuccess = false;
    }

    this.settingLogCategories = false;
  }
}

