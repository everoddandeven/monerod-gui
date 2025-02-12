import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { I2pWebconsoleRoutingModule } from './i2p-webconsole-routing.module';
import { I2pWebconsoleComponent } from './i2p-webconsole.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [I2pWebconsoleComponent],
  imports: [
    CommonModule,
    SharedModule,
    I2pWebconsoleRoutingModule
  ]
})
export class I2pWebconsoleModule { }
