import { AfterViewInit, Component, NgZone } from '@angular/core';
import { LogsService } from './logs.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss'
})
export class LogsComponent implements AfterViewInit {

  constructor(private navbarService: NavbarService, private logsService: LogsService, private ngZone: NgZone) {
    this.logsService.onLog.subscribe((message: string) => this.onLog());
  }

  public get lines(): string[] {
    return this.logsService.lines;
  }

  private onLog(): void {
    // Scorri automaticamente in basso
    setTimeout(() => {
      this.ngZone.run(() => {
        this.lines;
        const terminalOutput = document.getElementById('terminalOutput');
        if (terminalOutput) {
          terminalOutput.style.width = `${window.innerWidth}`;
          terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
      })
      
    }, 100);
  }

  public trackByFn(index: number, item: string): number {
    return index;  // usa l'indice per tracciare gli elementi
  }

  ngAfterViewInit(): void {
      this.navbarService.removeLinks();
  }
}
