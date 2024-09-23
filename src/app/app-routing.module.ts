import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';

import { HomeRoutingModule } from './home/home-routing.module';
import { DetailRoutingModule } from './detail/detail-routing.module';
import { HardForkInfoRoutingModule } from './hard-fork-info/hard-fork-info-routing.module';
import { SettingsModule } from './settings/settings.module';
import { TransactionsModule } from './transactions/transactions.module';

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
    HomeRoutingModule,
    DetailRoutingModule,
    TransactionsModule,
    HardForkInfoRoutingModule,
    SettingsModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
