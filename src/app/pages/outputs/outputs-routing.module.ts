import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OutputsComponent } from './outputs.component';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  {
    path: 'outputs',
    component: OutputsComponent
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OutputsRoutingModule { }
