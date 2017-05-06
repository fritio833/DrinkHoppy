import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { SingletonService } from '../../providers/singleton-service';
import { GoogleService } from '../../providers/google-service';
import { DemoService } from '../../providers/demo-service';

import { LocationDetailPage } from '../location-detail/location-detail';

import firebase from 'firebase';

@Component({
  selector: 'page-locate-beer',
  templateUrl: 'locate-beer.html'
})
export class LocateBeerPage {

  public beer:any;
  public geoLocation:any;
  public fbRef:any;
  public locations:FirebaseListObservable<any>;
  public locationsLen:number;
  public limit:any;
  public lastKey:string;
  public queryable:boolean = true;
  public placeIMGS = new Array();
  public distance = new Array();
  public beersFound = false;
  public beerRating:any;

  constructor(public navCtrl: NavController, 
              public params: NavParams,
              public geo: GoogleService,
              public angFire: AngularFire,
              public demo: DemoService,
              public sing:SingletonService) {
    this.beer = params.get('beer');
    this.fbRef = firebase.database();
    this.limit = new BehaviorSubject(10); 
  }

  getBeerLocations() {
    let locKey = '';

    console.log('beer',this.beer);
    this.demo.getBeerRating(this.beer.id).subscribe(rating=>{
      console.log('rating',rating);
      this.beerRating = rating;
    });

    this.sing.getGeolocation().subscribe(geo=>{
      console.log('geo',geo);
      this.geoLocation = this.geo.getCityState
      this.geo.reverseGeocodeLookup(geo.latitude,geo.longitude)
        .subscribe((resp)=>{
         this.geoLocation = resp;
         
         locKey = resp.city.toLowerCase()+'-'+resp.state.toLowerCase()+'-'+resp.country.toLowerCase();
         console.log('/beer_by_city/'+locKey+'/'+this.beer.id+'/locations');
         this.locations = this.angFire.database.list('/beer_by_city/'+locKey+'/'+this.beer.id+'/locations',{
            query:{
              orderByChild:'name',
              limitToFirst: this.limit,
              preserveSnapshot: true
            }
         });

         this.locations.subscribe(resp=>{

           this.locationsLen = resp.length;

           if (this.locationsLen) {
             this.beersFound = true;
           }

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

      },error=>{
        console.log('error getBeerLocations',error);  
      });       
    },error=>{
      console.log('error getBeerLocations',error);
    });
  }
 
  getThumbnail(picURL) {
    let thumb = picURL.replace(/s\d+\-w\d+/g, "s100-w100");
    return thumb;
  }
  
  getLocation(location) {
     this.geo.placeDetail(location.placeId).subscribe((resp)=>{
       //console.log('resp',resp);
       this.navCtrl.push(LocationDetailPage,{location:resp.result});
     });
    //this.navCtrl.push(LocationDetailPage);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LocateBeerPage');
    this.getBeerLocations();
  }

}
