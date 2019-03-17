import { Component } from '@angular/core';
import { AlertController, NavController, Platform } from 'ionic-angular';

import { DeviceProvider } from '../../providers/device.provider';
import { EBooksProvider } from '../../providers/ebooks.provider';
import { MYBOOKS_PAGE, SCAN_BOOK_PAGE } from '../pages.constants';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(
    private platform: Platform,
    private alertCtrl: AlertController,
    private nav: NavController,
    private deviceProvider: DeviceProvider,
    private ebooksProvider: EBooksProvider) {
  }

  ionViewWillEnter() {
    if (this.deviceProvider.checkNetworkDisconnected()) {
      this.presentOfflineAlert();
    }
    else {
      //trigger loading of ebooks - this speeds up later functionality when the ebooks list is actually required 
      this.loadEBooks();
    }
  }


  loadEBooks() {
    this.ebooksProvider.getAll().subscribe(
      (data) => {
        console.log('Ebooks loaded: ', data);
      },
      (error) => {
        console.error('ERROR: while loading ebooks...ignoring at this stage', error);
      }
    );
  }

  goToMyBooksPage() {
    this.nav.push(MYBOOKS_PAGE);
  }

  goToQRScanPage() {
    this.nav.push(SCAN_BOOK_PAGE);
  }

  presentOfflineAlert() {
    let alert = this.alertCtrl.create({
      enableBackdropDismiss: false,
      title: "Device Offline",
      subTitle: "A connection to internet is required to use this app. Please connect to a Wi-Fi or cellular network.",
      buttons: [
        {
          text: "OK",
          role: "cancel"
        }
      ]
    });
    alert.present();
  }

  presentFailureAlert(title: string, message: string) {
    if (this.deviceProvider.checkNetworkDisconnected()) {
      this.presentOfflineAlert();
    }
    else {
      let alert = this.alertCtrl.create({
        enableBackdropDismiss: false,
        title: title,
        message: message,
        buttons: [
          {
            text: "OK",
            role: "cancel",
            handler: () => {
              if (this.platform.is('android')) {
                this.platform.exitApp();
              }
            }
          }
        ]
      });
      alert.present();
    }
  }

}
