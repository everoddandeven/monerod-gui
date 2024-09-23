import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HardForkInfoComponent } from './hard-fork-info.component';

const routes: Routes = [{
  path: 'hardforkinfo',
  component: HardForkInfoComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HardForkInfoRoutingModule { }
