import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NetworkRoutingModule } from './network-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { NetworkComponent } from './network.component';


@NgModule({
  declarations: [NetworkComponent],
  imports: [
    CommonModule,
    SharedModule,
    NetworkRoutingModule
  ]
})
export class NetworkModule { }
