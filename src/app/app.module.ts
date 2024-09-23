import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { HomeModule } from './home/home.module';
import { DetailModule } from './detail/detail.module';

import { AppComponent } from './app.component';
import { SidebarComponent } from "./sidebar/sidebar.component";
import { LoadComponent } from "./load/load.component";
import { BansModule } from './bans/bans.module';
import { NavbarComponent } from "./navbar/navbar.component";
import { MiningModule } from './mining/mining.module';
import { TransactionsModule } from './transactions/transactions.module';
import { OutputsModule } from './outputs/outputs.module';

// AoT requires an exported function for factories
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader =>  new TranslateHttpLoader(http, './assets/i18n/', '.json');

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    HomeModule,
    DetailModule,
    BansModule,
    MiningModule,
    TransactionsModule,
    OutputsModule,
    TranslateModule,
    AppRoutingModule,
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: httpLoaderFactory,
            deps: [HttpClient]
        }
    }),
    SidebarComponent,
    NavbarComponent,
    LoadComponent
],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
