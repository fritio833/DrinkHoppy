import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

import firebase from 'firebase';

import { SingletonService } from '../../providers/singleton-service';
import { GoogleService } from '../../providers/google-service';

import { LocationDetailPage } from '../location-detail/location-detail';

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
              public loadingCtrl:LoadingController,
              public sing:SingletonService) {}

  getPopularLocations() {

    let key = this.sing.getLocationKey();
    console.log('locObj',key);
    this.locations = this.angFire.database.list('/location_by_city/'+key,{
      query: {
        orderByChild: 'checkinCount'
      }
    }); 


    this.sing.getGeolocation().subscribe(geo=>{

      this.locations.subscribe(resp=>{

        this.locationsLen = resp.length;

        for (var i=0;i<this.locationsLen;i++) {
          let locPoint = {lat:geo.latitude,lng:geo.longitude};
          let userPoint = {lat:resp[i].lat,lng:resp[i].lng};             
          this.placeIMGS[resp[i].$key] = this.getThumbnail(resp[i].photo);
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
     this.geo.placeDetail(location.placeId).subscribe((resp)=>{
       //console.log('resp',resp);
       this.navCtrl.push(LocationDetailPage,{location:resp.result,loading:this.loading});
     });
    //this.navCtrl.push(LocationDetailPage);
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
