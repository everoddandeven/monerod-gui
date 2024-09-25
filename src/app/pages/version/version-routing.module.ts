import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VersionComponent } from './version.component';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  {
    path: 'version',
    component: VersionComponent
  }
];
@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VersionRoutingModule { }
