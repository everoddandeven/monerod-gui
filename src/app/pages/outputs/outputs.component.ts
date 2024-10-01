import { AfterViewInit, Component, NgZone } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { Output } from '../../../common';

@Component({
  selector: 'app-outputs',
  templateUrl: './outputs.component.html',
  styleUrl: './outputs.component.scss'
})
export class OutputsComponent implements AfterViewInit {
  public readonly navbarLinks: NavbarLink[];

  public daemonRunning: boolean = false;

  public getOutsJsonString: string = '';
  public getOutsGetTxId: boolean = false;

  public keyImages: string = '';
  public isKeyImageSpentError: string = '';
  public isKeyImageSpentResult?: boolean;
  public gettingKeyImages: boolean = false;

  constructor(private daemonService: DaemonService, private navbarService: NavbarService, private ngZone: NgZone) {
    this.navbarLinks = [
      new NavbarLink('pills-outputs-overview-tab', '#pills-outputs-overview', 'outputs-overview', true, 'Overview'),
      new NavbarLink('pills-outputs-histogram-tab', '#pills-outputs-histogram', 'outputs-histogram', false, 'Histogram'),
      new NavbarLink('pills-outputs-distribution-tab', '#pills-outputs-distribution', 'outputs-distribution', false, 'Distribution'),
      new NavbarLink('pills-is-key-image-spent-tab', '#pills-is-key-image-spent', 'is-key-image-spent', false, 'Is Key Image Spent')
    ];

    this.daemonService.isRunning().then((value) => {
      this.daemonRunning = value;
    })
  }

  ngAfterViewInit(): void {
      this.navbarService.setLinks(this.navbarLinks);
      this.ngZone.run(() => {
        //const $ = require('jquery');
        //const bootstrapTable = require('bootstrap-table');
        
        const $table = $('#outsTable');
        $table.bootstrapTable({
          
        });
        $table.bootstrapTable('refreshOptions', {
          classes: 'table table-bordered table-hover table-dark table-striped'
        });
        $table.bootstrapTable('showLoading');      
        this.load();
      });
  }

  public get getOutsOuts() {
    try {
      const _outs: any[] = JSON.parse(this.getOutsJsonString);
      const outs: Output[] = [];

      _outs.forEach((_out) => outs.push(Output.parse(_out)));

      return outs;
    }
    catch(error) {
      return []
    }
  }

  public validOuts(): boolean {
    try {
      const _outs: any[] = JSON.parse(this.getOutsJsonString);

      if (!Array.isArray(_outs)) {
        return false;
      }

      _outs.forEach((_out) => Output.parse(_out));

      return true;
    } catch(error) {
      return false;
    }
  }

  public async getOuts() {
    const $table = $('#outsTable');
    $table.bootstrapTable({});

    const outs = await this.daemonService.getOuts(this.getOutsOuts, this.getOutsGetTxId);

    $table.bootstrapTable('load', outs)

  }

  public async isKeyImageSpent(): Promise<void> {
    
  }

  public async load() {
    await this.getOuts();
  }
}
