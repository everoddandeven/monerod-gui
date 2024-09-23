import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MiningRoutingModule } from './mining-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { LoadComponent } from '../../load/load.component';
import { MiningComponent } from './mining.component';


@NgModule({
  declarations: [MiningComponent],
  imports: [
    CommonModule, SharedModule,MiningRoutingModule, LoadComponent
  ]
})
export class MiningModule { }
