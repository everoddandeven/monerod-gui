import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TorControlRoutingModule } from './tor-control-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { TorControlComponent } from './tor-control.component';


@NgModule({
  declarations: [TorControlComponent],
  imports: [
    CommonModule, SharedModule,
    TorControlRoutingModule
  ]
})
export class TorControlModule { }
