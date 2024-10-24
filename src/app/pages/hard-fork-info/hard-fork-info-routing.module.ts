import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HardForkInfoComponent } from './hard-fork-info.component';
import { CommonModule } from '@angular/common';

const routes: Routes = [{
  path: 'hardforkinfo',
  component: HardForkInfoComponent
}];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HardForkInfoRoutingModule { }
