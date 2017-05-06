import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { GoogleService } from '../../providers/google-service';

import { EventMapPage } from '../event-map/event-map';

@Component({
  selector: 'page-event-info',
  templateUrl: 'event-info.html'
})
export class EventInfoPage {

  constructor(public navCtrl: NavController, public navParams: NavParams,public geo:GoogleService) {}

  getGoogleStaticMap() {
    return this.geo.getStaticMap(30.409806,-87.212869);
  }

  goToPlaceWebsite(url) {
    window.open(encodeURI(url),'_system');
  }

  getEventMap() {
    this.navCtrl.push(EventMapPage);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EventInfoPage');
  }

}
