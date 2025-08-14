import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';

import { HomeRoutingModule } from './pages/home/home-routing.module';
import { DetailRoutingModule } from './pages/detail/detail-routing.module';
import { HardForkInfoRoutingModule } from './pages/hard-fork-info/hard-fork-info-routing.module';
import { SettingsModule } from './pages/settings/settings.module';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'detail',
    pathMatch: 'full'
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {}),
    FormsModule,
    HomeRoutingModule,
    DetailRoutingModule,
    HardForkInfoRoutingModule,
    SettingsModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
