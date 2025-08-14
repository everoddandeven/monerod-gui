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
    new NavbarPill('contact', 'Contact'),
    new NavbarPill('donate', 'Donate')
  ];

  public donateCrypto: 'XMR' | 'BTC' | 'WOW' = 'XMR';
  public readonly XMRAddress: string = '84Q1SdQgFWaEWRn5KcvSPCQUa3NF39EJ3HPCTaiM86RHLLftqgTZpkP24jXrK5YpeedWbQAjHcFcDLpFJfr9TypfAU7pPjA';
  public readonly BTCAddress: string = 'bc1qndc2lesy0sse9vj33a35pnfrqz4znlhhs58vfp';
  public readonly WOWAddress: string = 'WW33Zj3xu6EGTyKVWaz8EQZmqsTXKdK5eG7PDRaiPuJ1LyREhGHLCRDX3AaLx4r9NFCThRvsbq99KATbswJaxd3T1iwQLJ3Tw';
  public addressCopied: boolean = false;

  public get guiVersion(): string {
    return this.daemonService.getGuiVersion();
  }

  public copyAddressToClipboard(): void {
    window.electronAPI.copyToClipboard(this.donateCrypto == 'XMR' ? this.XMRAddress : this.donateCrypto == 'WOW' ? this.WOWAddress : this.BTCAddress);
    this.addressCopied = true;

    setTimeout(() => {
      this.addressCopied = false;
    }, 1500);
  }

}

