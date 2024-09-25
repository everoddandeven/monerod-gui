import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VersionRoutingModule } from './version-routing.module';
import { VersionComponent } from './version.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [VersionComponent],
  imports: [
    CommonModule,
    SharedModule,
    VersionRoutingModule
  ]
})
export class VersionModule { }
