import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MiningComponent } from './mining.component';

const routes: Routes = [{
  path: 'mining',
  component: MiningComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MiningRoutingModule { }
