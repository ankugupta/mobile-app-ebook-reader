import { Component } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { AlertController, IonicPage, LoadingController, NavController, Platform } from 'ionic-angular';

import { SCAN_BOOK_PAGE } from '../pages.constants';
import { EBook } from '../../model/ebook';
import { DeviceProvider } from '../../providers/device.provider';
import { EBooksProvider } from '../../providers/ebooks.provider';
import { SqlStorageProvider } from '../../providers/sql-storage.provider';

@IonicPage()
@Component({
  selector: 'page-my-books',
  templateUrl: 'my-books.html',
})
export class MyBooksPage {

  myEBooks: EBook[] = [];
  searchedBooks: EBook[] = [];

  constructor(
    private platform: Platform,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private nav: NavController,
    private screenOrientation: ScreenOrientation,
    private iab: InAppBrowser,
    private deviceProvider: DeviceProvider,
    private ebooksProvider: EBooksProvider,
    private sqldb: SqlStorageProvider) {
  }

  ionViewWillEnter() {
    this.loadBooks();
  }

  loadBooks() {
    let loader = this.loadingCtrl.create();
    loader.present();

    // load saved list of ebooks
    this.sqldb.getEBooks().then(
      savedBooks => {
        this.ebooksProvider.getBookIdToBookMap().subscribe(
          bookIdToBookMap => {

            // calculate books to display
            savedBooks.forEach(savedBook => {
              if (bookIdToBookMap.has(savedBook.bookId)) {
                const book: EBook = bookIdToBookMap.get(savedBook.bookId);
                this.myEBooks.push(book);
                this.searchedBooks.push(book);
              }
            });
            loader.dismiss();
          },
          error => {
            loader.dismiss();
            console.error('ERROR: while loading ebooks: ', error);
            this.presentFailureAlert("Technical Error", "Please try again later");
          }
        )
      },
      error => {
        loader.dismiss();
        this.presentFailureAlert("Technical Error", "Please try again later");
      }
    );
  }

  public filterBooksByTitle(ev: any) {
    const val = ev.target.value;
    if (val && val.trim() !== '') {
      this.searchedBooks = this.myEBooks.filter(function (item) {
        return item.title.toLowerCase().includes(val.toLowerCase());
      });
    }
    else {
      this.searchedBooks = this.myEBooks.slice(0, this.myEBooks.length);
    }
  }

  //opens media with given url in in-app-browser
  public openMedia(mediaUrl: string) {

    let iab = this.iab.create(mediaUrl, "_blank", "location=yes");

    iab.on("loadstop").subscribe(
      () => {
        // console.log("loadstop fired!");
        // iab.show();
      }
    )
    iab.on("exit").subscribe(
      () => {
        //this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
        //console.log("orientation after browser close: " + this.screenOrientation.type);
      }
    )

  }

  goToQRScanPage() {
    this.nav.push(SCAN_BOOK_PAGE);
  }

  presentOfflineAlert() {
    let alert = this.alertCtrl.create({
      title: "Device Offline",
      subTitle: "A connection to internet is required to use this section. Please connect to a Wi-Fi or cellular network.",
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
