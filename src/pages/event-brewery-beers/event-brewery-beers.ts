import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, ToastController, LoadingController, ActionSheetController } from 'ionic-angular';
import { PhotoViewer } from '@ionic-native/photo-viewer';

import firebase from 'firebase';

import { BreweryService } from '../../providers/brewery-service';
import { AuthService } from '../../providers/auth-service';
import { ConnectivityService } from '../../providers/connectivity-service';
import { SingletonService } from '../../providers/singleton-service';

import { BeerDetailPage } from '../beer-detail/beer-detail';

@Component({
  selector: 'page-event-brewery-beers',
  templateUrl: 'event-brewery-beers.html'
})
export class EventBreweryBeersPage {

  public beers:any;
  public breweryName:string;
  public brewery:any;
  public loading:any;
  public fbRef:any;
  public user:any;
  public approve = new Array();
  public eventId:any;

  constructor(public navCtrl: NavController, 
              public beerAPI:BreweryService, 
              public params: NavParams,
              public loadingCtrl: LoadingController,
              public photo:PhotoViewer,
              public auth:AuthService,
              public actionCtrl: ActionSheetController,
              public conn:ConnectivityService,
              public toastCtrl:ToastController,
              public sing:SingletonService,
              public view:ViewController) {
                //this.beers = params.get('beers');
                //this.breweryName = params.get('breweryName');
                this.fbRef = firebase.database();
                this.user = this.auth.getUser();
                this.brewery = params.get('brewery');
                this.eventId = params.get('eventId');

                if (this.brewery.hasOwnProperty('beers'))
                  this.beers = this.brewery.beers;
              }

  cancel() {
    this.view.dismiss();
  }

  getChecklist() {
    this.approve = [];
    this.fbRef.ref('beer_events/fGgpIu/'+this.user.uid).once('value').then(snapshot=>{
      snapshot.forEach(item=>{
        this.approve[item.key] = item.val().approve;
      });
    });
  }

  getMap(label,breweryId) {
    
    let map = 'https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/event_maps%2F'+this.eventId+'%2F'+this.brewery.booth+'.gif?alt=media&token=d6838db0-8ce6-4167-8517-8da3d9abbeab';
    this.photo.show(map,label, {share: false});
    
    console.log('yup',map);
  }

  getBeerDetail(beerId) {

  	this.navCtrl.push(BeerDetailPage,{beerId:beerId});

  }  

  showLoading() {
    this.loading = this.loadingCtrl.create({
    });
    this.loading.present();
  }

  rateUp(beerId) {
    this.fbRef.ref('beer_events/fGgpIu/'+this.user.uid+'/'+beerId).set({
      beerId:beerId,
      approve:1
    }).then(resp=>{
      this.getChecklist();      
    });
  }

  rateDown(beerId) {
    this.fbRef.ref('beer_events/fGgpIu/'+this.user.uid+'/'+beerId).set({
      beerId:beerId,
      approve:0
    }).then(resp=>{
      this.getChecklist();
    });  
  }

  removeThumb(beerId) {
    this.fbRef.ref('beer_events/fGgpIu/'+this.user.uid+'/'+beerId).remove().then(resp=>{
      this.getChecklist();
    });  
  }

  getBeerFavList() {
    this.approve = [];
    this.fbRef.ref('favorite_beers/'+this.user.uid).once('value').then(snapshot=>{
      snapshot.forEach(item=>{
        this.approve[item.key] = true;
      });
    });    
  }

  saveBeerToFavorites(beer) {
    
    beer['timestamp'] = firebase.database.ServerValue.TIMESTAMP;
    this.fbRef.ref('/favorite_beers/'+this.user.uid+'/'+beer.id).set(beer).then(resp=>{
      this.presentToast(beer.name + ' saved to favorites.');
      this.getBeerFavList();
    });

  }

  removeBeerFromFavorites(beer) {
    this.fbRef.ref('/favorite_beers/'+this.user.uid+'/'+beer.id).remove().then(resp=>{
      this.presentToast(beer.name + ' removed from favorites');
      this.getBeerFavList();
    });    
  }  

  getBeerActions(beer) {

    let removeFromFav = false;
    let favText = 'Save to Favorites';

    if (this.approve[beer.id]!=null) {
      removeFromFav = true;
      favText = 'Remove from Favorites';
    }    
    
    let actionSheet = this.actionCtrl.create({
      title: beer.name,
      buttons: [
        {
          icon: 'beer',
          text: 'Beer Detail',
          handler: () => {
            this.getBeerDetail(beer.id);
          }
        },{
          icon: 'map',
          text: 'Find It',
          handler: () => {
            this.getMap('Booth #' + beer.booth + ' - '+beer.name,beer.breweries[0].id);           
          }
        },{          
          icon: 'thumbs-up',
          text: favText,
          handler: () => {
            //this.rateUp(beer.id);
            if (removeFromFav)
              this.removeBeerFromFavorites(beer);
            else
              this.saveBeerToFavorites(beer);                           
          }
        },{
          icon: 'close',
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

  ionViewDidLoad() {
    console.log('ionViewDidLoad EventBreweryBeersPage');
    //this.getChecklist();
    this.getBeerFavList();
  }

}
