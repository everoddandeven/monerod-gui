import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { LogsService } from './logs.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss'
})
export class LogsComponent implements AfterViewInit {
  @ViewChild('logTerminal', { read: ElementRef }) public logTerminal?: ElementRef<any>;

  constructor(private navbarService: NavbarService, private logsService: LogsService, private ngZone: NgZone) {
    this.logsService.onLog.subscribe((message: string) => this.onLog());
  }

  public get lines(): string[] {
    return this.logsService.lines;
  }

  private scrollToBottom(): void {
    this.lines;
    const terminalOutput = <HTMLDivElement | null>document.getElementById('terminalOutput');
    if (terminalOutput) {
      terminalOutput.style.width = `${window.innerWidth}`;
      console.log(`scrolling from ${terminalOutput.offsetTop} to ${terminalOutput.scrollHeight}`)
      terminalOutput.scrollBy(0, terminalOutput.scrollHeight)
    }
  }

  private onLog(): void {
    if (this.logTerminal) this.logTerminal.nativeElement.scrollTop = this.logTerminal.nativeElement.scrollHeight;
    // Scorri automaticamente in basso
    setTimeout(() => {
      this.ngZone.run(() => {
        this.scrollToBottom();
      })
      
    }, 100);
  }

  public trackByFn(index: number, item: string): number {
    return index;  // usa l'indice per tracciare gli elementi
  }

  ngAfterViewInit(): void {
      this.navbarService.removeLinks();
      this.scrollToBottom();
  }
}
