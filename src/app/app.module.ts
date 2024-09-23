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

import { HomeModule } from './pages/home/home.module';
import { DetailModule } from './pages/detail/detail.module';

import { AppComponent } from './app.component';
import { LoadComponent } from "./shared/components/load/load.component";
import { BansModule } from './pages/bans/bans.module';
import { NavbarComponent } from "./shared/components/navbar/navbar.component";
import { MiningModule } from './pages/mining/mining.module';
import { TransactionsModule } from './pages/transactions/transactions.module';
import { OutputsModule } from './pages/outputs/outputs.module';
import { SidebarComponent } from './shared/components';

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
    NavbarComponent,
    LoadComponent
],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
