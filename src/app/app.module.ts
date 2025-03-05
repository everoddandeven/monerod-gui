import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { HomeModule } from './pages/home/home.module';
import { DetailModule } from './pages/detail/detail.module';
import { BlockchainModule } from './pages/blockchain/blockchain.module';

import { AppComponent } from './app.component';
import { LoadComponent } from "./shared/components/load/load.component";
import { BansModule } from './pages/bans/bans.module';
import { MiningModule } from './pages/mining/mining.module';
import { TransactionsModule } from './pages/transactions/transactions.module';
import { OutputsModule } from './pages/outputs/outputs.module';
import { SettingsModule } from './pages/settings/settings.module';
import { LogsModule } from './pages/logs/logs.module';
import { VersionModule } from './pages/version/version.module';
import { HardForkInfoModule } from './pages/hard-fork-info/hard-fork-info.module';
import { NetworkModule } from './pages/network/network.module';
import { PeersModule } from './pages/peers/peers.module';
import { AboutModule } from './pages/about/about.module';
import { I2pWebconsoleModule } from './pages/i2p-webconsole/i2p-webconsole.module';
import { TorControlModule } from './pages/tor-control/tor-control.module';

// AoT requires an exported function for factories
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader =>  new TranslateHttpLoader(http, './assets/i18n/', '.json');

@NgModule({ declarations: [AppComponent],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        CoreModule,
        SharedModule,
        HomeModule,
        DetailModule,
        BlockchainModule,
        BansModule,
        MiningModule,
        TransactionsModule,
        OutputsModule,
        LogsModule,
        SettingsModule,
        HardForkInfoModule,
        PeersModule,
        VersionModule,
        NetworkModule,
        AboutModule,
        I2pWebconsoleModule,
        TorControlModule,
        TranslateModule,
        AppRoutingModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: httpLoaderFactory,
                deps: [HttpClient]
            }
        }),
        LoadComponent], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {}
