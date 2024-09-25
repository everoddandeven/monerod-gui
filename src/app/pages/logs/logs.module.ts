import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogsRoutingModule } from './logs-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { LogsComponent } from './logs.component';


@NgModule({
  declarations: [LogsComponent],
  imports: [
    CommonModule,
    SharedModule,
    LogsRoutingModule
  ]
})
export class LogsModule { }
