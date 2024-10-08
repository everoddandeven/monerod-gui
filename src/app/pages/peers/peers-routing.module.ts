import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PeersComponent } from './peers.component';

const routes: Routes = [{
  path: 'peers',
  component: PeersComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PeersRoutingModule { }
