import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransactionsRoutingModule } from './transactions-routing.module';
import { TransactionsComponent } from './transactions.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [TransactionsComponent],
  imports: [
    CommonModule,
    SharedModule,
    TransactionsRoutingModule
  ]
})
export class TransactionsModule { }
