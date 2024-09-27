import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlockchainComponent } from './blockchain.component';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  {
    path: 'blockchain',
    component: BlockchainComponent
  }
];
@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlockchainRoutingModule { }
