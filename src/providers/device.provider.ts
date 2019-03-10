import { Injectable, NgZone } from '@angular/core';
import { Device } from '@ionic-native/device';
import { Platform } from 'ionic-angular';
import { Network } from '@ionic-native/network';

import 'rxjs/add/operator/map';
declare const networkinterface;

/**
 * This class provides helper methods to fetch device/platform 
 * related information.
 */

@Injectable()
export class DeviceProvider {

  ip: string = "0.0.0.0";

  constructor(private device: Device, private _ngZone: NgZone, private platform: Platform, private network: Network) {
    console.log('Hello DeviceProvider Constructed');
  }

  getDeviceToken() {
    if (this.device.uuid != null) {
      return this.device.uuid;
    } else {
      return '737785db-902c-d57d-903c-ef14fe55f78e';
    }
  }
  getUserAgent() {
    if (this.device.platform != null) {
      return this.device.platform;
    } else {
      return 'browser';
    }
  }
  getIpAddress() {
    if (this.platform.is('cordova')) {
      if (this.ip == '0.0.0.0') {
        this.refreshIP();
      }
      return this.ip;
    } else {
      return '1.186.0.0';
    }
  }

  getDeviceModel() {
    return this.device.model;
  }

  getOSVersion() {
    return this.device.version;
  }

  private refreshIP() {
    console.log('refreshIP clicked');
    try {
      networkinterface.getWiFiIPAddress((ip) => {
        console.log('getWiFiIPAddress ip', ip);
        this._ngZone.run(() => {
          this.ip = ip;
        });
      });

      networkinterface.getCarrierIPAddress((ip) => {
        console.log('getCarrierIPAddress ip', ip);
        this._ngZone.run(() => {
          this.ip = ip;
        });
      });
    } catch (e) {
      console.error(e);
    }
  }

  public checkNetworkDisconnected(): boolean {
    if (this.platform.is('cordova')) {
      return this.network.type == this.network.Connection.NONE;
    }
    return false;
  }
}
