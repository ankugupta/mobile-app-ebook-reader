import { Component } from '@angular/core';
import { AlertController, IonicPage, LoadingController, NavController, Platform } from 'ionic-angular';

import { EBook } from '../../model/ebook';
import { DeviceProvider } from '../../providers/device.provider';
import { EBooksProvider } from '../../providers/ebooks.provider';
import { SqlStorageProvider } from '../../providers/sql-storage.provider';
import { SCAN_BOOK_PAGE } from '../pages.constants';

@IonicPage()
@Component({
  selector: 'page-my-books',
  templateUrl: 'my-books.html',
})
export class MyBooksPage {

  myEBooks: EBook[] = [];
  searchedBooks: EBook[] = [];
  noBooksMessage: boolean;

  constructor(
    private platform: Platform,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private nav: NavController,
    private deviceProvider: DeviceProvider,
    private ebooksProvider: EBooksProvider,
    private sqldb: SqlStorageProvider) {
  }

  ionViewWillEnter() {
    console.log('mybooks ionViewWillEnter fired')
    this.noBooksMessage = false;
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
            this.myEBooks = [];
            this.searchedBooks = [];
            // calculate books to display
            savedBooks.forEach(savedBook => {
              if (bookIdToBookMap.has(savedBook.bookId)) {
                const book: EBook = bookIdToBookMap.get(savedBook.bookId);
                this.myEBooks.push(book);
                this.searchedBooks.push(book);
              }
            });

            if (this.myEBooks.length == 0) {
              this.noBooksMessage = true;
            }
            console.log('my books load complete');
            loader.dismiss();
          },
          error => {
            loader.dismiss();
            console.error('ERROR: while loading ebooks: ', error);
            this.presentFailureAlert("Technical Error", "Please try again later");
          }
        )
      },
      () => {
        loader.dismiss();
        this.presentFailureAlert("Technical Error", "Please try again later");
      }
    );
  }

  // called from UI
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

  // called from UI
  public openMedia(bookUrl: string) {
    this.ebooksProvider.openMedia(bookUrl);
  }

  // called from UI
  goToQRScanPage() {
    this.nav.push(SCAN_BOOK_PAGE);
  }

  presentOfflineAlert() {
    let alert = this.alertCtrl.create({
      enableBackdropDismiss: false,
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
