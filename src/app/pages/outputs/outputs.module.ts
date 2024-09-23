import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OutputsRoutingModule } from './outputs-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { OutputsComponent } from './outputs.component';


@NgModule({
  declarations: [OutputsComponent],
  imports: [
    CommonModule,
    SharedModule,
    OutputsRoutingModule
  ]
})
export class OutputsModule { }
