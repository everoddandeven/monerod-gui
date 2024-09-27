import { Component, NgZone } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';

@Component({
  selector: 'app-blockchain',
  templateUrl: './blockchain.component.html',
  styleUrl: './blockchain.component.scss'
})
export class BlockchainComponent {
  public readonly navbarLinks: NavbarLink[];
  public daemonRunning: boolean = false;

  constructor(private daemonService: DaemonService, private ngZone: NgZone) {
    this.navbarLinks = [
      new NavbarLink('pills-last-block-header-tab', '#pills-last-block-header', 'pills-last-block-header', false, 'Last Block Header', true),
      new NavbarLink('pills-get-block-tab', '#pills-get-block', 'pills-get-block', false, 'Get Block', true),
      new NavbarLink('pills-get-block-header-tab', '#pills-get-block-header', 'pills-get-block-header', false, 'Get Block Header', true),
      new NavbarLink('pills-pop-blocks-tab', '#pills-pop-blocks', 'pills-pop-blocks', false, 'Pop Blocks', true),
      new NavbarLink('pills-save-bc-tab', '#pills-save-bc', 'pills-save-bc', false, 'Save Blockchain', true)
    ]

    this.daemonService.isRunning().then((result: boolean) => this.daemonRunning = result);

    this.daemonService.onDaemonStatusChanged.subscribe((running) => {
      this.ngZone.run(() => {
        this.daemonRunning = running;
      });
    });
    this.daemonService.isRunning().then((value: boolean) => {
      this.ngZone.run(() => {
        this.daemonRunning = value;
      });
    });
  }

  
}
