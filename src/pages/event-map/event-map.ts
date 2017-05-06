import { Component } from '@angular/core';
import { PhotoViewer } from '@ionic-native/photo-viewer';

import { NavController, NavParams, ActionSheetController } from 'ionic-angular';

import { BreweryService } from '../../providers/brewery-service';

import { BeerDetailPage } from '../beer-detail/beer-detail';

@Component({
  selector: 'page-event-map',
  templateUrl: 'event-map.html'
})
export class EventMapPage {
  public choice = 'breweries';
  public eventBeers = new Array();

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public beerAPI: BreweryService,
              public actionCtrl: ActionSheetController,
              public photo:PhotoViewer) {}


  getMap(label) {
    if (label==null)
      this.photo.show('https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/img%2FFestivalMap.png?alt=media&token=1e43e8e6-ca91-40fa-abb3-d0c3441047d0','Emeral Coast Beerfestival', {share: false});
    else
      this.photo.show('https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/img%2FFestivalMap.png?alt=media&token=1e43e8e6-ca91-40fa-abb3-d0c3441047d0',label, {share: false});
  }

  getBeerList() {

  }

  getDetail() {


  }

  getBeerDetail(beerDbId) {
    this.navCtrl.push(BeerDetailPage,{beerId:beerDbId});
  }  

  getEventBeers() {
    this.beerAPI.findBeerByName('Abita').subscribe(beers=>{
      console.log('beers',beers);
      this.eventBeers = beers.data;
    });
  }

  getBeerActions() {
    
    let actionSheet = this.actionCtrl.create({
      title: 'Abita Brewing Co.',
      buttons: [
        {
          text: 'Beer List',
          handler: () => {
            this.getBeerList();
          }
        },{
          text: 'Brewery Detail',
          handler: () => {
            this.getDetail();            
          }
        },{
          text: 'View Map',
          handler: () => {
            this.getMap('Booth #17 - Abita Brewing Co.');            
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }    

  ionViewDidLoad() {
    console.log('ionViewDidLoad EventMapPage');
    this.getEventBeers();
  }

}
