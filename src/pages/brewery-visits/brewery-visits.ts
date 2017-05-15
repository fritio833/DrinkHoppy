import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, ToastController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { Observable } from 'rxjs/Observable';

import { AuthService } from '../../providers/auth-service';
import { BreweryService } from '../../providers/brewery-service';
import { GoogleService } from '../../providers/google-service';

import firebase from 'firebase';

import { BreweryDetailPage } from '../brewery-detail/brewery-detail';

@Component({
  selector: 'page-brewery-visits',
  templateUrl: 'brewery-visits.html'
})
export class BreweryVisitsPage {

  public breweries: FirebaseListObservable<any>;
  public isLookup:boolean = false;
  public uid:any;
  public loading:any;
  public user:any;
  public displayName:any;
  
  constructor(public navCtrl: NavController, 
              public auth:AuthService, 
              public params: NavParams,
              public beerAPI: BreweryService,
              public geo: GoogleService,
              public loadingCtrl:LoadingController,
              public toastCtrl:ToastController,
              public angFire:AngularFire) {
    this.user = this.auth.getUser();
    this.isLookup = params.get('lookup');

    if (this.isLookup) {
      this.uid = params.get('uid');
      this.displayName = params.get('name');
    }  else {
      this.uid = this.user.uid;
    }

  }

  getBreweries() {
    this.breweries = this.angFire.database.list('/breweries_visited/'+this.uid,{
      query:{
        orderByChild:'name'
      }
    });    
  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }  

 getBreweryDetail(brewery) {


    this.showLoading('Loading Brewery...');
   //console.log('brewery',brewery);

    this.geo.getPlaceFromGoogleByLatLng(brewery.name,brewery.lat,brewery.lng).subscribe(resp=>{
    
      this.beerAPI.getBreweryDetail(brewery.breweryId,brewery.breweryLocId).subscribe(pub=>{
        console.log('pub',pub);
        this.loading.dismiss();
        this.navCtrl.push(BreweryDetailPage,{brewery:pub['detail'],beers:pub['beers'],place:resp['result']});        
      },error=>{
        console.log('error getBrewery',error);
        this.loading.dismiss().catch(() => {});
        this.presentToast('Could not connect. Check connection.');         
      });

    },error=>{
        console.log('error getBreweryFromGoogle',error);
        this.loading.dismiss().catch(() => {});
        this.presentToast('Could not connect. Check connection.');      
    });

 }

  showLoading(msg) {
    this.loading = this.loadingCtrl.create({
      content: msg
    });
    this.loading.present();
  }  

  ionViewDidLoad() {
    this.getBreweries();
    console.log('ionViewDidLoad BreweryVisitsPage');
  }

}
