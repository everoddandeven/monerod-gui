import { Component } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  public readonly links: NavbarLink[] = [
    new NavbarLink('pills-overview-tab', '#pills-overview', 'pills-overview', true, 'License', false),
    new NavbarLink('pills-contact-tab', '#pills-contact', 'pills-contact', false, 'Contact', false),
    new NavbarLink('pills-donate-tab', '#pills-donate', 'pills-donate', false, 'Donate', false)
  ];

  public donateCrypto: 'XMR' | 'BTC' = 'XMR';
  public readonly XMRAddress: string = '84Q1SdQgFWaEWRn5KcvSPCQUa3NF39EJ3HPCTaiM86RHLLftqgTZpkP24jXrK5YpeedWbQAjHcFcDLpFJfr9TypfAU7pPjA';
  public readonly BTCAddress: string = 'bc1qndc2lesy0sse9vj33a35pnfrqz4znlhhs58vfp';
  public addressCopied: boolean = false;

  public get guiVersion(): string {
    return this.daemonService.getGuiVersion();
  }

  constructor(private daemonService: DaemonService) {

  }

  public copyAddressToClipboard(): void {
    window.electronAPI.copyToClipboard(this.donateCrypto == 'XMR' ? this.XMRAddress : this.BTCAddress);
    this.addressCopied = true;

    setTimeout(() => {
      this.addressCopied = false;
    }, 1500);
  }

}

