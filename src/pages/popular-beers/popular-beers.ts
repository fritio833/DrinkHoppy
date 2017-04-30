import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController, LoadingController, ModalController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

import firebase from 'firebase';

import { SingletonService } from '../../providers/singleton-service';
import { BreweryService } from '../../providers/brewery-service';

import { BeerDetailPage } from '../beer-detail/beer-detail';
import { CheckinPage } from '../checkin/checkin';
import { LocateBeerPage } from '../locate-beer/locate-beer';

@Component({
  selector: 'page-popular-beers',
  templateUrl: 'popular-beers.html'
})
export class PopularBeersPage {

  public beers:FirebaseListObservable<any>;
  public loading:any;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams, 
              public angFire:AngularFire,
              public beerAPI:BreweryService,
              public modalCtrl:ModalController,
              public loadingCtrl:LoadingController,
              public actionCtrl:ActionSheetController,
              public sing:SingletonService) {}

  getPopularBeers() {

    let key = this.sing.getLocationKey();
    console.log('locObj',key);
    this.beers = this.angFire.database.list('/beer_by_city/'+key,{
      query: {
        orderByChild: 'checkinCount'
      }
    });  
  }

  getBeerDetail(beerDbId) {
    this.navCtrl.push(BeerDetailPage,{beerId:beerDbId,favorites:true});
  }

  locateBeer(beerId) {

    this.showLoading();
    this.beerAPI.loadBeerById(beerId).subscribe(resp=>{
      //console.log('resp',resp);
      this.loading.dismiss();
      this.navCtrl.push(LocateBeerPage,{beer:resp.data});
    },error=>{
      console.log('error loadBeerById API',error);
    });
  }

  checkinBeer(beer) {
    
    this.showLoading();
    this.beerAPI.loadBeerById(beer.$key).subscribe(resp=>{
      this.loading.dismiss();
      if (resp.hasOwnProperty('data')) {
        let modal = this.modalCtrl.create(CheckinPage,{checkinType:'beer',beer:resp.data});
        modal.onDidDismiss(()=> {
          
        });
        modal.present();      
      }
    },error=>{
      console.log('error loadBeerById API',error);
    });
    
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
    });
    this.loading.present();
  }  

  getBeerActions(beer) {
    
    let actionSheet = this.actionCtrl.create({
      title: beer.name,
      buttons: [
        {
          text: 'Check-in',
          handler: () => {
            this.checkinBeer(beer);
          }
        },{
          text: 'Locate',
          handler: () => {
            this.locateBeer(beer.$key);            
          }
        },{
          text: 'Details',
          handler: () => {
            this.getBeerDetail(beer.$key);
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
    console.log('ionViewDidLoad PopularBeersPage');
    this.getPopularBeers();
   
  }

}
