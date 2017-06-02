import { Injectable } from '@angular/core';
import { Network } from 'ionic-native';
import { Platform, Events } from 'ionic-angular';

declare var Connection;

@Injectable()
export class ConnectivityService {

  public onDevice: boolean;

  constructor(public platform: Platform,public event:Events) {
     this.onDevice = this.platform.is('cordova');
  }

  isOnline(): boolean {
    if(this.onDevice && Network.type){
      return Network.type !== Connection.NONE;
    } else {
      return navigator.onLine; 
    }
  }
 
  isOffline(): boolean {
    if(this.onDevice && Network.type){
      return Network.type === Connection.NONE;
    } else {
      return !navigator.onLine;   
    }
  }

}
