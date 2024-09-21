import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BansRoutingModule } from './bans-routing.module';
import { BansComponent } from './bans.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    BansComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    BansRoutingModule
  ]
})
export class BansModule { }
