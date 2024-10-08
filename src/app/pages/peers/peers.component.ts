import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { DaemonDataService, DaemonService } from '../../core/services';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { Subscription } from 'rxjs';
import { resolve } from 'path';

@Component({
  selector: 'app-peers',
  templateUrl: './peers.component.html',
  styleUrl: './peers.component.scss'
})
export class PeersComponent implements AfterViewInit, OnDestroy {

  public readonly navbarLinks: NavbarLink[];

  public limitInPeers: number = 0;
  public limitingInPeers: boolean = false;
  public limitInPeersSuccess: boolean = false;
  public limitInPeersError: string = '';
  public limitInPeersResult: number = 0;

  public limitOutPeers: number = 0;
  public limitingOutPeers: boolean = false;
  public limitOutPeersSuccess: boolean = false;
  public limitOutPeersError: string = '';
  public limitOutPeersResult: number = 0;

  public refreshingPeerList: boolean = false;

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonData.stopping;
  }

  private subscriptions: Subscription[] = [];

  constructor(private daemonService: DaemonService, private daemonData: DaemonDataService, private navbarService: NavbarService, private ngZone: NgZone) {
    this.navbarLinks = [
      new NavbarLink('pills-peer-list-tab', '#pills-peer-list', 'pills-peer-list', false, 'Peer List'),
      new NavbarLink('pills-public-nodes-tab', '#pills-public-nodes', 'pills-public-nodes', false, 'Public Nodes'),
      new NavbarLink('pills-in-peers-tab', '#pills-in-peers', 'pills-in-peers', false, 'In Peers'),
      new NavbarLink('pills-out-peers-tab', '#pills-out-peers', 'pills-out-peers', false, 'Out Peers')
    ];
  }

  public ngAfterViewInit(): void {
    this.navbarService.setLinks(this.navbarLinks);

    this.ngZone.run(() => {
      const $publicNodesTable = $('#publicNodesTable');
      const $peerListTable = $('#peerListTable');

      $publicNodesTable.bootstrapTable({});
      $publicNodesTable.bootstrapTable('refreshOptions', {
        classes: 'table table-bordered table-hover table-dark table-striped'
      });
  
      $peerListTable.bootstrapTable({});
      $peerListTable.bootstrapTable('refreshOptions', {
        classes: 'table table-bordered table-hover table-dark table-striped'
      });

      $publicNodesTable.bootstrapTable('load', this.daemonData.publicNodes);
      $peerListTable.bootstrapTable('load', this.daemonData.peerList);

      const sub = this.daemonData.syncEnd.subscribe(() => {
        $publicNodesTable.bootstrapTable('load', this.daemonData.publicNodes);
        //$peerListTable.bootstrapTable('load', this.daemonData.peerList);
      });
  
      this.subscriptions.push(sub);
    });
  }

  public async refreshPeerListTable(): Promise<void> {
    this.refreshingPeerList = true;
    
    try {
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          this.ngZone.run(() => {
            try {
              const $peerListTable = $('#peerListTable');
              $peerListTable.bootstrapTable('load', this.daemonData.peerList);
              resolve();
            }
            catch(error) {
              reject(error);
            }
          });
        }, 1000);
      });
    }
    catch(error) {
      console.error(error);
    }

    this.refreshingPeerList = false;
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });

    this.subscriptions = [];
  }

  public async inPeers(): Promise<void> {
    this.limitingInPeers = true;

    try {
      this.limitInPeersResult = await this.daemonService.inPeers(this.limitInPeers);
      this.limitInPeersError = '';
      this.limitInPeersSuccess = true;
    } catch(error) {
      console.error(error);
      this.limitInPeersSuccess = false;
      this.limitInPeersResult = 0;
      this.limitInPeersError = `${error}`;
    }

    this.limitingInPeers = false;
  } 

  public async outPeers(): Promise<void> {
    this.limitingOutPeers = true;

    try {
      this.limitOutPeersResult = await this.daemonService.outPeers(this.limitOutPeers);
      this.limitOutPeersError = '';
      this.limitOutPeersSuccess = true;
    } catch(error) {
      console.error(error);
      this.limitOutPeersSuccess = false;
      this.limitOutPeersResult = 0;
      this.limitOutPeersError = `${error}`;
    }

    this.limitingOutPeers = false;
  } 

}
