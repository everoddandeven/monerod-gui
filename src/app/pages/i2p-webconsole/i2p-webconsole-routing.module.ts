import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { I2pWebconsoleComponent } from './i2p-webconsole.component';

const routes: Routes = [
  {
    path: 'i2pwebconsole',
    component: I2pWebconsoleComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class I2pWebconsoleRoutingModule { }
