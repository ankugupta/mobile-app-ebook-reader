import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Observable } from 'rxjs';

import { EBOOKS_URI } from '../app/app.constants';
import { EBook } from '../model/ebook';
import { Result } from '../model/result';
import { DataProvider } from './data.provider';

/**
 * Provider for ebooks
 */
@Injectable()
export class EBooksProvider {

  private bookIdToBookMap: Map<string, EBook>;
  private qrCodeToBookMap: Map<string, EBook>;
  private books: EBook[];

  constructor(
    private iab: InAppBrowser,
    private data: DataProvider) {
  }

  public getAll(): Observable<EBook[]> {

    if (this.books && this.books.length > 0) {
      console.log('returning from cache')
      return Observable.of(this.books);
    }
    else {
      const requestUrl = EBOOKS_URI;
      //const requestUrl = 'assets/mock/ebooks.json';
      console.log("fetching books from url: " + requestUrl);
      return this.data.getAll<Result<EBook>>(requestUrl)
        .map(data => {
          this.books = data.resources;
          this.bookIdToBookMap = new Map();
          this.qrCodeToBookMap = new Map();
          data.resources.forEach(ebook => {
            this.bookIdToBookMap.set(ebook.bookId, ebook);
            this.qrCodeToBookMap.set(ebook.qrCode, ebook);
          });
          return data.resources;
        });
    }
  }

  public getBookIdToBookMap(): Observable<Map<string, EBook>> {
    if (this.bookIdToBookMap) {
      console.log('returning cached map');
      return Observable.of(this.bookIdToBookMap);
    }
    else {
      return this.getAll().map(
        () => {
          return this.bookIdToBookMap;
        }
      )
    }
  }

  public getQRCodeToBookMap(): Observable<Map<string, EBook>> {
    if (this.qrCodeToBookMap) {
      console.log('returning cached map');
      return Observable.of(this.qrCodeToBookMap);
    }
    else {
      return this.getAll().map(
        () => {
          return this.qrCodeToBookMap;
        }
      )
    }
  }


  //opens media with given url in in-app-browser
  public openMedia(mediaUrl: string) {

    // hardwareback option enables back button to be used for navigating back in browser history
    this.iab.create(mediaUrl, "_blank", "location=no,hardwareback=no");

    // below code may be used in future

    // iab.on("loadstop").subscribe(
    //   () => {
    //    console.log("loadstop fired!");
    //    iab.show();
    //   }
    // )
    // iab.on("exit").subscribe(
    //   () => {
    //   this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
    //   console.log("orientation after browser close: " + this.screenOrientation.type);
    //   }
    // )

  }
}
