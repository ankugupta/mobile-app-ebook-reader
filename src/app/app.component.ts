import { Component, ViewChild } from '@angular/core';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Nav, Platform } from 'ionic-angular';

import { HomePage } from '../pages/home/home';
import { SqlStorageProvider } from '../providers/sql-storage.provider';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage: any;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    screenOrientation: ScreenOrientation,
    sqldb: SqlStorageProvider
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      statusBar.hide();

      //wait for DB setup
      sqldb.getDatabaseState().subscribe(rdy => {
        console.log('sql db ready: ', rdy);
        if (rdy) {
          if (platform.is('cordova')) {
            screenOrientation.lock(screenOrientation.ORIENTATIONS.PORTRAIT);
          }
          splashScreen.hide();
          // navigate to home page
          this.nav.setRoot(HomePage);
        }
      });
    });
  }

}

