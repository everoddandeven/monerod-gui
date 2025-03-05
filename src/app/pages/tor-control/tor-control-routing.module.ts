import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TorControlComponent } from './tor-control.component';

const routes: Routes = [
    {
      path: 'torcontrol',
      component: TorControlComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TorControlRoutingModule { }
