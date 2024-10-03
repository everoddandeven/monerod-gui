import { AfterViewInit, Component, NgZone } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { HistogramEntry, Output, OutputDistribution } from '../../../common';

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

  public keyImagesJsonString: string = '';
  public isKeyImageSpentError: string = '';
  public isKeyImageSpentResult?: { keyImage: string, spentStatus: string }[];
  public gettingKeyImages: boolean = false;

  public get validKeyImages(): boolean {
    try {
      const keyImages: string[] = JSON.parse(this.keyImagesJsonString);

      if (!Array.isArray(keyImages)) {
        return false;
      }

      keyImages.forEach((keyImage: string) => {
        if (typeof keyImage != 'string') {
          throw new Error();
        }
      });

      return true;
    } catch(error) {
      return false;
    }
  }

  public get keyImages(): string[] {
    if (!this.validKeyImages) {
      return [];
    }

    return JSON.parse(this.keyImagesJsonString);
  }

  public getOutHistogramAmountsJsonString: string = '';
  public getOutHistogramMinCount: number = 0;
  public getOutHistogramMaxCount: number = 0;
  public getOutHistogramUnlocked: boolean = false;
  public getOutHistogramRecentCutoff: number = 0;
  public getOutHistogramResult?: HistogramEntry[];
  public getOutHistogramError: string = '';
  public gettingOutHistogram: boolean = false;

  public getOutDistributionAmountsJsonString: string = '';
  public getOutDistributionFromHeight: number = 0;
  public getOutDistributionToHeight: number = 0;
  public getOutDistributionCumulative: boolean = false;
  public getOutDistributionResult?: OutputDistribution[];
  public getOutDistributionError: string = '';

  public get getOutDistributionAmounts(): number[] {
    if (!this.validOutDistributionAmounts) {
      return [];
    }

    return JSON.parse(this.getOutDistributionAmountsJsonString);
  }

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

  public get validOuts(): boolean {
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

  public get validOutDistributionAmounts(): boolean {
    try {
      const amounts: number[] = JSON.parse(this.getOutDistributionAmountsJsonString);

      if(!Array.isArray(amounts)) {
        return false;
      }

      amounts.forEach((amount) => {
        if (typeof amount != 'number' || amount <= 0) throw new Error("");
      })

      return true;
    }
    catch(error) {
      return false;
    }
  }

  public async getOutDistribution(): Promise<void> {
    try 
    {
      const amounts = this.getOutDistributionAmounts;
      const cumulative = this.getOutDistributionCumulative;
      const fromHeight = this.getOutDistributionFromHeight;
      const toHeight = this.getOutDistributionToHeight;

      this.getOutDistributionResult = await this.daemonService.getOutputDistribution(amounts, cumulative, fromHeight, toHeight);
      this.getOutDistributionError = '';
    }
    catch(error) {
      this.getOutDistributionError = `${error}`;
    }
  }

  public async getOutHistogram(): Promise<void> {
    
  }

  public async isKeyImageSpent(): Promise<void> {
    this.gettingKeyImages = true;
    try {
      const keyImages: string[] = this.keyImages;

      const spentList: number[] = await this.daemonService.isKeyImageSpent(...keyImages);

      if (keyImages.length != spentList.length) {
        throw new Error("Invalid spent list size response");
      }

      this.isKeyImageSpentResult = [];
      for(let i = 0; i < keyImages.length; i++) {
        const ki = keyImages[i];
        const spentStatus = spentList[i];

        this.isKeyImageSpentResult.push({
          keyImage: ki,
          spentStatus: spentStatus == 0 ? 'unspent' : spentStatus == 1 ? 'spent in blockchain' : spentStatus == 2 ? 'spent in tx pool' : 'unknown'
        })

        const $table = $('#keyImagesTable');
        $table.bootstrapTable({});
        $table.bootstrapTable('load', this.isKeyImageSpentResult);
        this.isKeyImageSpentError = '';
      }

    } catch(error) {
      this.isKeyImageSpentError = `${error}`;
      this.isKeyImageSpentResult = undefined;
    }

    this.gettingKeyImages = false;
  }

  public async load() {
  }
}
