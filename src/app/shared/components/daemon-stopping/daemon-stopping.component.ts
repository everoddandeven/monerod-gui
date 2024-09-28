import { Component } from '@angular/core';
import { DaemonService } from '../../../core/services/daemon/daemon.service';

@Component({
  selector: 'app-daemon-stopping',
  templateUrl: './daemon-stopping.component.html',
  styleUrl: './daemon-stopping.component.scss'
})
export class DaemonStoppingComponent {

  public get stopping(): boolean {
    return this.daemonService.stopping;
  }

  constructor(private daemonService: DaemonService) {
     
  }
  
}
