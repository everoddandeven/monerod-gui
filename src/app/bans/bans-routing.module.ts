import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BansComponent } from './bans.component';

const routes: Routes = [{
    path: 'bans',
    component: BansComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BansRoutingModule { }
