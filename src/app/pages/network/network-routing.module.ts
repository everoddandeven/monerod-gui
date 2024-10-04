import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NetworkComponent } from './network.component';
import { CommonModule } from '@angular/common';


const routes: Routes = [
  {
    path: 'network',
    component: NetworkComponent
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NetworkRoutingModule { }
