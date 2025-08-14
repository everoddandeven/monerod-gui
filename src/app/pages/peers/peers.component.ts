import { AfterViewInit, Component, NgZone, inject } from '@angular/core';
import { DaemonDataService, DaemonService } from '../../core/services';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { Subscription } from 'rxjs';
import { BasePageComponent } from '../base-page/base-page.component';
import { PeerInfo, PublicNode } from '../../../common';

@Component({
    selector: 'app-peers',
    templateUrl: './peers.component.html',
    styleUrl: './peers.component.scss',
    standalone: false
})
export class PeersComponent extends BasePageComponent implements AfterViewInit {
  private daemonService = inject(DaemonService);
  private daemonData = inject(DaemonDataService);
  private ngZone = inject(NgZone);


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
  public refreshingPublicNodes: boolean = false;

  public getPeerListError: string = '';
  public getPublicNodesError: string = '';

  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonData.stopping;
  }

  private peerList?: PeerInfo[];
  private publicNodes?: PublicNode[];

  constructor() {
    super();
    this.setLinks([
      new NavbarLink('pills-peer-list-tab', '#pills-peer-list', 'pills-peer-list', false, 'Peer List'),
      new NavbarLink('pills-public-nodes-tab', '#pills-public-nodes', 'pills-public-nodes', false, 'Public Nodes'),
      new NavbarLink('pills-in-peers-tab', '#pills-in-peers', 'pills-in-peers', false, 'In Peers'),
      new NavbarLink('pills-out-peers-tab', '#pills-out-peers', 'pills-out-peers', false, 'Out Peers')
    ]);
  }

  public ngAfterViewInit(): void {
    this.ngZone.run(() => {
      this.loadTables();

      this.refreshPeerListTable().then().catch((error: any) => console.error(error));
      this.refreshPublicNodesTable().then().catch((error: any) => console.error(error));

      const statusSub: Subscription = this.daemonService.onDaemonStatusChanged.subscribe((running: boolean) => {
        if (running) this.loadTables();
        else this.destroyTables();
      });
  
      this.subscriptions.push(statusSub);
    });
  }

  private loadTables(): void {
    this.loadPeerListTable();
    this.loadPublicNodesTable();
  }

  private loadPeerListTable(): void {
    const loading = this.peerList === undefined;

    this.loadTable('peerListTable', this.peerList ? this.peerList : [], loading);
  }

  private loadPublicNodesTable(): void {
    this.loadTable('publicNodesTable', this.publicNodes ? this.publicNodes : [], this.publicNodes === undefined);
  }

  public async refreshPeerListTable(): Promise<void> {
    if (!await this.daemonService.isRunning()) {
      return;
    }

    this.refreshingPeerList = true;
    
    try {
      this.peerList = await this.daemonService.getPeerList();
    }
    catch(error: any) {
      console.error(error);
      this.getPeerListError = `${error}`;
      this.peerList = undefined;
    }

    this.loadPeerListTable();
    this.refreshingPeerList = false;
  }

  public async refreshPublicNodesTable(): Promise<void> {
    if (!await this.daemonService.isRunning()) {
      return;
    }
    
    this.refreshingPublicNodes = true;
    
    try {
      this.publicNodes = await this.daemonService.getPublicNodes();
    }
    catch(error: any) {
      console.error(error);
      this.publicNodes = undefined;
      this.getPublicNodesError = `${error}`;
    }

    this.loadPublicNodesTable();
    this.refreshingPublicNodes = false;
  }

  public async inPeers(): Promise<void> {
    this.limitingInPeers = true;

    try {
      this.limitInPeersResult = await this.daemonService.inPeers(this.limitInPeers);
      this.limitInPeersError = '';
      this.limitInPeersSuccess = true;
    } catch(error: any) {
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
    } catch(error: any) {
      console.error(error);
      this.limitOutPeersSuccess = false;
      this.limitOutPeersResult = 0;
      this.limitOutPeersError = `${error}`;
    }

    this.limitingOutPeers = false;
  } 

}
