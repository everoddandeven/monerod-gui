import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PeersRoutingModule } from './peers-routing.module';
import { PeersComponent } from './peers.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [PeersComponent],
  imports: [
    CommonModule,
    SharedModule,
    PeersRoutingModule
  ]
})
export class PeersModule { }
