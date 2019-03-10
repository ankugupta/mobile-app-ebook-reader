import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { IonicPage, NavController, NavParams, Platform, AlertController, LoadingController } from 'ionic-angular';
import { Subscription } from 'rxjs/Subscription';

import { EBook } from '../../model/ebook';
import { DeviceProvider } from '../../providers/device.provider';
import { EBooksProvider } from '../../providers/ebooks.provider';
import { SqlStorageProvider } from '../../providers/sql-storage.provider';

//REQUIRES QR-SCANNER PLUGIN

@IonicPage()
@Component({
  selector: 'page-scan-book',
  templateUrl: 'scan-book.html',
})
export class ScanBookPage {

  public cameraPermission: boolean = false;
  public scanning: boolean = false;
  public scanSub: Subscription;
  public qrCodeToBookMap: Map<string, EBook>;

  constructor(
    private screenOrientation: ScreenOrientation,
    private iab: InAppBrowser,
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    private changeDetector: ChangeDetectorRef,
    private qrScanner: QRScanner,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private deviceProvider: DeviceProvider,
    private ebooksProvider: EBooksProvider,
    private sqldb: SqlStorageProvider ) {

  }

  //prepare QR scanner
  ionViewWillEnter() {
    if (this.deviceProvider.checkNetworkDisconnected()) {
      this.presentOfflineAlert();
    }

    else {
      let loader = this.loadingCtrl.create();
      loader.present();

      this.ebooksProvider.getQRCodeToBookMap().subscribe(
        data => {
          this.qrCodeToBookMap = data;
          if (this.platform.is('cordova')) {
            this.qrScanner.getStatus().then((status: QRScannerStatus) => {
              if (!status.prepared) {
                this.prepareQRScanner();
              } else {
                console.log("qr scanner already prepared: ", status);
                this.cameraPermission = true;
              }
            })
          }
          loader.dismiss();
        },
        error => {
          loader.dismiss();
          console.error('ERROR: while loading ebooks: ', error);
          this.presentFailureAlert("Technical Error", "Please try again later");
        }
      )
    }


    //TODO
    // this.platform.registerBackButtonAction(() => {
    //   console.log("back pressed in home");
    //   this.cleanUpScanner();
    // });

  }

  private cleanUpScanner() {
    console.log("cleaning up");
    this.scanning = false;
    ((<any>window).document.querySelector('ion-app') as HTMLElement).classList.remove('cameraView');

    if (this.platform.is('cordova')) {
      this.qrScanner.getStatus().then((status: QRScannerStatus) => {
        if (status.showing) {
          console.log("hiding");
          this.qrScanner.hide();
        }
        if (status.scanning) {
          if (!this.scanSub.closed) {
            console.log("unsubing");
            this.scanSub.unsubscribe();
          }
          else {
            //scanner is inconsistent
            console.log("destroying");
            this.qrScanner.destroy();
          }
        }

      })
    }
  }

  private prepareQRScanner(): void {

    this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        console.log("after preparation: ", status);
        if (status.authorized) {
          // camera permission was granted
          console.log('Permission granted');
          this.cameraPermission = true;

        } else if (status.denied && status.canOpenSettings) {
          // camera permission was permanently denied
          // you must use QRScanner.openSettings() method to guide the user to the settings page
          // then they can grant the permission from there
          console.log('Permission denied permanently');
          if (confirm("Would you like to enable QR code scanning? You can allow camera access in your settings.")) {
            this.qrScanner.openSettings();
          }

        } else {
          // permission was denied, but not permanently. You can ask for permission again at a later time.
          console.log("permission denied temporarily");
          this.navCtrl.pop();
        }
      })
      .catch((e: any) => {
        console.log('Error is', e)
        this.presentFailureAlert("Technical Error", "Please try again later");
      });
  }

  // called from UI
  public scanForQRCode(): void {
    // start scanning
    this.scanSub = this.qrScanner.scan().subscribe(
      (text: string) => {
        console.log('Scanned something', text);


        this.qrScanner.hide(); // hide camera preview
        this.scanning = false;
        ((<any>window).document.querySelector('ion-app') as HTMLElement).classList.remove('cameraView');

        this.scanSub.unsubscribe(); // stop scanning
        this.qrScanner.getStatus().then((status: QRScannerStatus) => {
          console.log("after detection: ", status);
        });

        this.changeDetector.detectChanges();

        if (this.qrCodeToBookMap.has(text)) {
          this.saveBookAndOpenMedia(this.qrCodeToBookMap.get(text));
        }
        else {
          this.presentInfoAlert("Invalid QR", "Please scan a valid QR code printed on the book cover");
        }

      },
      error => {
        console.log("scan error: ", error);
      });

    ((<any>window).document.querySelector('ion-app') as HTMLElement).classList.add('cameraView');
    this.scanning = true;
    this.qrScanner.show().then((status: QRScannerStatus) => {
      console.log("after show called: ", status);
      console.log("after show called: ", status.showing);
      console.log("after show called: ", status.scanning);
    })
  }


public saveBookAndOpenMedia(book: EBook){

  this.sqldb.insertBook({bookId: book.bookId}).then(
    () => {
      console.log('book record saved successfully');
    },
    error => {
      console.error('ERROR: while saving book: ', error);
    }
  )

  this.openMedia(book.bookUrl);
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


  ionViewWillLeave() {
    console.log("ionViewWillLeave: trigger cleanup of scanner");
    this.cleanUpScanner();
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

  presentInfoAlert(title: string, message: string) {

    let alert = this.alertCtrl.create({
      title: title,
      message: message,
      buttons: [
        {
          text: "OK",
          role: "cancel"
        }
      ]
    });
    alert.present();
  }

}
