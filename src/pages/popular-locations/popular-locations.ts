import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

import firebase from 'firebase';

import { SingletonService } from '../../providers/singleton-service';
import { GoogleService } from '../../providers/google-service';
import { BreweryService } from '../../providers/brewery-service';

import { LocationDetailPage } from '../location-detail/location-detail';
import { BreweryDetailPage } from '../brewery-detail/brewery-detail';

@Component({
  selector: 'page-popular-locations',
  templateUrl: 'popular-locations.html'
})
export class PopularLocationsPage {

  public locations:FirebaseListObservable<any>;
  public locationsLen:number;
  public queryable:boolean = true;
  public placeIMGS = new Array();
  public distance = new Array();
  public lastKey:string;
  public loading:any;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public angFire:AngularFire,
              public geo: GoogleService,
              public beerAPI: BreweryService,
              public loadingCtrl:LoadingController,
              public sing:SingletonService) {}

  getPopularLocations() {

    let key = this.sing.getLocationKey();
    console.log('locObj',key);
    this.locations = this.angFire.database.list('/location_by_city/'+key,{
      query: {
        orderByChild: 'checkinCount',
        limitToFirst: 20
      }
    }); 


    this.sing.getGeolocation().subscribe(geo=>{

      this.locations.subscribe(resp=>{

        this.locationsLen = resp.length;

        for (var i=0;i<this.locationsLen;i++) {
          let locPoint = {lat:geo.latitude,lng:geo.longitude};
          let userPoint = {lat:resp[i].lat,lng:resp[i].lng};             
          this.placeIMGS[resp[i].$key] = this.geo.getThumbnail(resp[i].photo,100);
          let dist = this.geo.getDistance(locPoint,userPoint,true);
          this.distance[resp[i].$key] = Math.round(dist * 10) / 10;
        }

        if (resp.length > 0) {
          // If the last key in the list equals the last key in the database
          if (resp[resp.length - 1].$key === this.lastKey) {
            this.queryable = false;
          } else {
            this.queryable = true;
          }
        }             
      });
    });
  }

  getLocation(location) {
    this.showLoading('Loading. Please wait...');

     if (location.isBrewery === 'N') {     
       this.geo.placeDetail(location.placeId).subscribe((resp)=>{
         //console.log('resp',resp);
         this.navCtrl.push(LocationDetailPage,{location:resp.result,loading:this.loading});
       });
     } else {
       this.getBrewery(location);
     }
    //this.navCtrl.push(LocationDetailPage);
  }

  getBrewery(location) {
    this.geo.getPlaceFromGoogleByLatLng(location.name,location.lat,location.lng).subscribe(resp=>{
    
      this.beerAPI.getBreweryDetail(location.breweryId,location.breweryLocId).subscribe(pub=>{
        console.log('pub',pub);
        this.loading.dismiss();
        this.navCtrl.push(BreweryDetailPage,{brewery:pub['detail'],beers:pub['beers'],place:resp['result']});        
      },error=>{
        console.log('error getBrewery',error);
        this.loading.dismiss().catch(() => {});
        //this.presentToast('Could not connect. Check connection.');         
      });

    },error=>{
        console.log('error getBreweryFromGoogle',error);
        this.loading.dismiss().catch(() => {});
        //this.presentToast('Could not connect. Check connection.');      
    });    
  }

  getThumbnail(picURL) {
    let thumb = picURL.replace(/s\d+\-w\d+/g, "s100-w100");
    return thumb;
  }

  showLoading(msg) {
    this.loading = this.loadingCtrl.create({
      content: msg
    });
    this.loading.present();
  }  

  ionViewDidLoad() {
    console.log('ionViewDidLoad PopularLocationsPage');
    this.getPopularLocations();
  }

}
