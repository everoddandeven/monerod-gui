import { Component, NgZone, inject } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { HistogramEntry, Output, OutputDistribution } from '../../../common';
import { DaemonDataService } from '../../core/services';
import { BasePageComponent } from '../base-page/base-page.component';

@Component({
    selector: 'app-outputs',
    templateUrl: './outputs.component.html',
    styleUrl: './outputs.component.scss',
    standalone: false
})
export class OutputsComponent extends BasePageComponent {
  private daemonData = inject(DaemonDataService);
  private daemonService = inject(DaemonService);
  private ngZone = inject(NgZone);


  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonData.stopping;
  }

  public get daemonRestarting(): boolean {
    return this.daemonService.restarting;
  }

  public getOutsJsonString: string = '';
  public getOutsGetTxId: boolean = false;
  public getOutsError: string = '';
  public getOutsSuccess: boolean = false;
  public gettingOuts: boolean = false;

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
    } catch {
      return false;
    }
  }

  public get keyImages(): string[] {
    if (!this.validKeyImages) {
      return [];
    }

    return <string[]>JSON.parse(this.keyImagesJsonString);
  }

  public getOutHistogramAmountsJsonString: string = '';
  public getOutHistogramMinCount: number = 0;
  public getOutHistogramMaxCount: number = 0;
  public getOutHistogramUnlocked: boolean = false;
  public getOutHistogramRecentCutoff: number = 0;
  public getOutHistogramResult?: HistogramEntry[];
  public getOutHistogramError: string = '';
  public gettingOutHistogram: boolean = false;

  public get getOutHistogramAmounts(): number[] {
    if (!this.validOutHistogramAmounts) {
      return [];
    }

    return <number[]>JSON.parse(this.getOutHistogramAmountsJsonString);
  }

  public gettingOutDistribution: boolean = false;
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

    return <number[]>JSON.parse(this.getOutDistributionAmountsJsonString);
  }

  constructor() {
    super();

    this.setLinks([
      new NavbarLink('pills-outputs-get-outs-tab', '#pills-outputs-get-outs', 'outputs-get-outs', false, 'Get Outs'),
      new NavbarLink('pills-outputs-histogram-tab', '#pills-outputs-histogram', 'outputs-histogram', false, 'Histogram'),
      new NavbarLink('pills-outputs-distribution-tab', '#pills-outputs-distribution', 'outputs-distribution', false, 'Distribution'),
      new NavbarLink('pills-is-key-image-spent-tab', '#pills-is-key-image-spent', 'is-key-image-spent', false, 'Is Key Image Spent')
    ]);
  }

  public get getOutsOuts() {
    try {
      const _outs: any[] = JSON.parse(this.getOutsJsonString);
      const outs: Output[] = [];

      _outs.forEach((_out) => outs.push(Output.parse(_out)));

      return outs;
    }
    catch {
      return []
    }
  }

  public get validOuts(): boolean {
    try {
      const _outs: any[] = JSON.parse(this.getOutsJsonString);

      if (!Array.isArray(_outs)) {
        return false;
      }

      if (_outs.length == 0) {
        return false;
      }

      _outs.forEach((_out) => Output.parse(_out));

      return true;
    } catch {
      return false;
    }
  }

  public async getOuts() {
    this.gettingOuts = true;

    try {
      const $table = $('#outsTable');
      $table.bootstrapTable({});
  
      const outs = await this.daemonService.getOuts(this.getOutsOuts, this.getOutsGetTxId); 
      $table.bootstrapTable('load', outs);

      this.getOutsError = '';
      this.getOutsSuccess = true;
    }
    catch(error: any) {
      console.error(error);
      this.getOutsError = `${error}`;
      this.getOutsSuccess = false;
    }

    this.gettingOuts = false;
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
    catch {
      return false;
    }
  }

  public get validOutHistogramAmounts(): boolean {
    try {
      const amounts: number[] = JSON.parse(this.getOutHistogramAmountsJsonString);

      if(!Array.isArray(amounts)) {
        return false;
      }

      amounts.forEach((amount) => {
        if (typeof amount != 'number' || amount <= 0) throw new Error("");
      })

      return true;
    }
    catch {
      return false;
    }
  }

  public async getOutDistribution(): Promise<void> {
    this.gettingOutDistribution = true;

    try 
    {
      const amounts = this.getOutDistributionAmounts;
      const cumulative = this.getOutDistributionCumulative;
      const fromHeight = this.getOutDistributionFromHeight;
      const toHeight = this.getOutDistributionToHeight;

      this.getOutDistributionResult = await this.daemonService.getOutputDistribution(amounts, cumulative, fromHeight, toHeight);
      this.loadOutDistributionTable();
      this.getOutDistributionError = '';
    }
    catch(error: any) {
      this.getOutDistributionError = `${error}`;
      this.getOutDistributionResult = undefined;
    }

    this.gettingOutDistribution = false;
  }

  private loadOutDistributionTable(): void {
    this.loadTable('outDistributionsTable', this.getOutDistributionResult ? this.getOutDistributionResult : []);
  }

  private loadOutHistogramTable(): void {
    this.loadTable('outHistogramsTable', this.getOutHistogramResult ? this.getOutHistogramResult : []);
  }

  public async getOutHistogram(): Promise<void> {
    this.gettingOutHistogram = true;

    try {
      this.getOutHistogramResult = await this.daemonService.getOutputHistogram(this.getOutHistogramAmounts, this.getOutHistogramMinCount, this.getOutHistogramMaxCount, this.getOutHistogramUnlocked, this.getOutHistogramRecentCutoff);
      this.getOutHistogramError = '';
      this.loadOutHistogramTable();
    }
    catch(error: any) {
      console.error(error);
      this.getOutHistogramError = `${error}`;
      this.getOutHistogramResult = undefined;
    }

    this.gettingOutHistogram = false;
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

        this.loadTable('keyImagesTable', this.isKeyImageSpentResult);
        this.isKeyImageSpentError = '';
      }

    } catch(error: any) {
      this.isKeyImageSpentError = `${error}`;
      this.isKeyImageSpentResult = undefined;
    }

    this.gettingKeyImages = false;
  }

}
