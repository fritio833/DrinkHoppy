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
    this.breweries = this.angFire.database.list('/users/'+this.uid+'/breweriesVisited',{
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

 getBreweryDetail(breweryId,breweryName) {


    let foundBrewpub:number = -1;

    this.showLoading('Loading Brewery...');

    this.beerAPI.loadBreweryLocations(breweryId).subscribe((success)=>{

      for (let i = 0; i < success.data.length; i++) {
        // Brewpubs get thes prioirty, or tasting rooms that's open to the public
        if (success.data[i].locationType == 'brewpub' || success.data[i].openToPublic == 'Y') {
          foundBrewpub = i;
          break;
        }
      }

      if (foundBrewpub == -1) {
        foundBrewpub = 0;
      }

      console.log('breweries returned',success);
      
      this.getBreweryFromGoogle(breweryName,
                                success.data[foundBrewpub].latitude,
                                success.data[foundBrewpub].longitude).subscribe(resp=>{
        console.log('data',resp['result']);
        
        this.beerAPI.loadLocationById(success.data[foundBrewpub].id).subscribe((pub)=>{
                
          this.beerAPI.loadBreweryBeers(pub.data.breweryId).subscribe((beers)=>{

              this.loading.dismiss();
              this.navCtrl.push(BreweryDetailPage,{brewery:pub.data,beers:beers,place:resp['result']});
          },error=>{
            console.log('error',error);
            this.loading.dismiss().catch(() => {});
            this.presentToast('Could not connect. Check connection.');
          });
          
        },error=>{
          console.log('error',error);
          this.loading.dismiss().catch(() => {});
          this.presentToast('Could not connect. Check connection.');
        });
      });
      
    },error=>{
      console.log('error',error);
      this.loading.dismiss().catch(() => {});
      this.presentToast('Could not connect. Check connection.');
    }); 
 }

  getBreweryFromGoogle(breweryName,lat,lng) {
    //console.log('brewery',brewery);
    let _breweryName = encodeURIComponent(breweryName);

    return new Observable(observer=>{
      this.geo.getPlaceByOrigin(_breweryName,lat,lng).subscribe(pub=>{
        if (pub.results.length) {
          //Get place detail
          this.geo.placeDetail(pub.results[0].place_id).subscribe(detail=>{
            //console.log('detail',detail);
            observer.next(detail);
          });
        } else {
          observer.next(false);
        }
      });      
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
