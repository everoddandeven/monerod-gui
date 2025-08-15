import { Component, inject } from '@angular/core';
import { NavbarPill } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrl: './about.component.scss',
    standalone: false
})
export class AboutComponent {
  private daemonService = inject(DaemonService);

  public readonly links: NavbarPill[] = [
    new NavbarPill('overview', 'License', true),
    new NavbarPill('contact', 'Contact', false, false),
    new NavbarPill('donate', 'Donate', false, false)
  ];

  public readonly XMRAddress: string = '84Q1SdQgFWaEWRn5KcvSPCQUa3NF39EJ3HPCTaiM86RHLLftqgTZpkP24jXrK5YpeedWbQAjHcFcDLpFJfr9TypfAU7pPjA';
  public addressCopied: boolean = false;

  public get guiVersion(): string {
    return this.daemonService.getGuiVersion();
  }

  public copyAddressToClipboard(): void {
    window.electronAPI.copyToClipboard(this.XMRAddress);
    this.addressCopied = true;

    setTimeout(() => {
      this.addressCopied = false;
    }, 1500);
  }

}

