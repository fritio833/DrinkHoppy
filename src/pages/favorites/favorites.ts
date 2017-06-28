import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, ToastController, ModalController, ActionSheetController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { Observable } from 'rxjs/Observable';
import firebase from 'firebase';

import { SingletonService } from '../../providers/singleton-service';
import { BreweryService } from '../../providers/brewery-service';
import { GoogleService } from '../../providers/google-service';
import { AuthService } from '../../providers/auth-service';

import { BeerDetailPage } from '../beer-detail/beer-detail';
import { CheckinPage } from '../checkin/checkin';
import { LocateBeerPage } from '../locate-beer/locate-beer';
import { BeerSuggestionPage } from '../beer-suggestion/beer-suggestion';
import { LocationDetailPage } from '../location-detail/location-detail';
import { BreweryDetailPage } from '../brewery-detail/brewery-detail'; 


@Component({
  selector: 'page-favorites',
  templateUrl: 'favorites.html'
})
export class FavoritesPage {

  public beers = new Array();
  public choice:string;
  public loading:any;
  public favBeerRef:any;
  public favBeers: FirebaseListObservable<any>;
  public uid:any;
  public fbRef:any;
  public user:any;
  public favLocations: FirebaseListObservable<any>;
  public isLookup:boolean = false;
  public displayName:string;

  constructor(public navCtrl:NavController, 
              public params:NavParams,
              public sing:SingletonService, 
              public storage:Storage,
              public beerAPI:BreweryService,
              public actionCtrl:ActionSheetController,
              public modalCtrl:ModalController,
              public angFire:AngularFire,
              public auth:AuthService,
              public loadingCtrl:LoadingController,
              public geo:GoogleService,
              public toastCtrl:ToastController) {
    this.choice = "beerlist";
    this.fbRef = firebase.database();
    this.user = this.auth.getUser();
    this.isLookup = params.get('lookup');

    if (this.isLookup) {
      this.uid = params.get('uid');
      this.displayName = params.get('name');
    }  else {
      this.uid = this.user.uid;
    }

  }

  getBeerDetail(beerDbId) {
    if (this.sing.online)
      this.navCtrl.push(BeerDetailPage,{beerId:beerDbId,favorites:true});
    else
      this.sing.showNetworkAlert();
  }
  
  checkinBeer(beer) {
    if (this.sing.online) {
      this.showLoading();
      this.beerAPI.loadBeerById(beer.id).subscribe(resp=>{
        this.loading.dismiss();
        console.log('beer',resp);
        if (resp.hasOwnProperty('data')) {
          let modal = this.modalCtrl.create(CheckinPage,{checkinType:'beer',beer:resp.data});
          modal.onDidDismiss(()=> {
            
          });
          modal.present();      
        }
      });
    } else {
      this.sing.showNetworkAlert();
    }
  }

  locateBeer(beer) {
    if (this.sing.online)
      this.navCtrl.push(LocateBeerPage,{beer:beer});
    else
      this.sing.showNetworkAlert();
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
            this.locateBeer(beer);            
          }
        },{
          text: 'Details',
          handler: () => {
            this.getBeerDetail(beer.id);
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

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }   

  getLocation(loc) {
     
    if (this.sing.online) {
      this.showLoading();

      if (loc.isBrewery=='Y') {
        this.getBrewery(loc);
      } else {
        this.geo.placeDetail(loc.$key).subscribe((resp)=>{

          this.navCtrl.push(LocationDetailPage,{location:resp.result,loading:this.loading});

        },error=>{
          console.log('error',error);
          this.loading.dismiss().catch(()=>{});
        });
      }
    } else {
      this.sing.showNetworkAlert();
    }
  }

  getBrewery(loc) {

    if (this.sing.online) {
      let foundBrewpub:number = -1;
      //this.showLoading();
      this.geo.getPlaceFromGoogleByLatLng(loc.name,loc.lat,loc.lng).subscribe(resp=>{
      
        this.beerAPI.getBreweryDetail(loc.breweryId,loc.breweryLocId).subscribe(pub=>{
          console.log('pub',pub);
           //this.loading.dismiss().catch(() => {});
          this.navCtrl.push(BreweryDetailPage,{brewery:pub['detail'],beers:pub['beers'],place:resp['result'],loading:this.loading});        
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
    } else {
      this.sing.showNetworkAlert();
    }
  }

  getFavBeers() {

    if (this.favBeers) {
      return;
    }

    this.showLoading();
    this.favBeers = this.angFire.database.list('/favorite_beers/'+this.uid+'/',{
      query:{
        orderByChild:'name'
      }
    });

    this.favBeers.subscribe(resp=>{
      this.loading.dismiss().catch(()=>{});
    },error=>{
      console.log('error getFavBeers',error);
      this.loading.dismiss().catch(()=>{});
    });
  }

  ionViewWillEnter() {
    console.log('ionViewDidLoad FavoritesPage');

    if (this.choice === 'beerlist')
      this.getFavBeers();

    if (this.choice === 'locationlist')
      this.getLocFavs();      
  }  

  showLoading() {
    this.loading = this.loadingCtrl.create({
    });
    this.loading.present();
  }

  getLocFavs() {

    if (this.favLocations) {
      return;
    }
    if (this.sing.online) {
      this.showLoading();
      this.favLocations = this.angFire.database.list('/favorite_locations/'+this.uid+'/',{
        query:{
          orderByChild:'name'
        }
      });

      this.favLocations.subscribe(resp=>{
        this.loading.dismiss().catch(()=>{});
      },error=>{
        console.log('error getFavBeers',error);
        this.loading.dismiss().catch(()=>{});
      });
    } else {
      this.sing.showNetworkAlert();
    }   

  }

  removeFavoriteLocation(loc) {
    //console.log('loc',loc);
    
    this.fbRef.ref('/favorite_locations/'+this.uid+'/'+loc.$key).remove().then(resp=>{
      this.presentToast(loc.name + ' removed from favorites');
    });
  }

  removeFavoriteBeer(beer) {
    this.fbRef.ref('/favorite_beers/'+this.uid+'/'+beer.id).remove().then(resp=>{
      this.presentToast(beer.name + ' removed from favorites');
    });
  }

  ionViewWillLeave() {

    if (this.favLocations) {
      this.favLocations = null;
    }

    if (this.favBeers) {
      this.favBeers = null;
    }

  }

}
