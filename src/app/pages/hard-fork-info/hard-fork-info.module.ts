import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HardForkInfoRoutingModule } from './hard-fork-info-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { HardForkInfoComponent } from './hard-fork-info.component';


@NgModule({
  declarations: [HardForkInfoComponent],
  imports: [
    CommonModule,
    SharedModule,
    HardForkInfoRoutingModule
  ]
})
export class HardForkInfoModule { }
