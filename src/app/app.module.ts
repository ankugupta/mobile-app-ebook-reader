//angular
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';


//ionic-natives
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { QRScanner } from '@ionic-native/qr-scanner';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SQLite } from '@ionic-native/sqlite';
import { Device } from '@ionic-native/device';
import { Network } from '@ionic-native/network';

//pages - all other pages are lazy loaded via their own modules
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { HelpPage } from '../pages/help/help';

//providers
import { EBooksProvider } from '../providers/ebooks.provider';
import { DataProvider } from '../providers/data.provider';
import { SqlStorageProvider } from '../providers/sql-storage.provider';
import { DeviceProvider } from '../providers/device.provider';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    HelpPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    HelpPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    QRScanner,
    InAppBrowser,
    ScreenOrientation,
    SQLite,
    Device,
    Network,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    EBooksProvider,
    DataProvider,
    SqlStorageProvider,
    DeviceProvider
  ]
})
export class AppModule {}
