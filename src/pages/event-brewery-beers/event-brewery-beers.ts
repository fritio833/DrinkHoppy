import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, LoadingController, ActionSheetController } from 'ionic-angular';
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
  public loading:any;
  public fbRef:any;
  public user:any;
  public approve = new Array();

  constructor(public navCtrl: NavController, 
              public beerAPI:BreweryService, 
              public params: NavParams,
              public loadingCtrl: LoadingController,
              public photo:PhotoViewer,
              public auth:AuthService,
              public actionCtrl: ActionSheetController,
              public conn:ConnectivityService,
              public sing:SingletonService,
              public view:ViewController) {
                this.beers = params.get('beers');
                this.fbRef = firebase.database();
                this.user = this.auth.getUser();
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
      console.log('approve',this.approve);
    });
  }

  getMap(label) {

      label = 'Booth #17 - Abita Brewing Co.';
      if (label==null)
        this.photo.show('https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/img%2FFestivalMap.png?alt=media&token=1e43e8e6-ca91-40fa-abb3-d0c3441047d0','Emeral Coast Beerfestival', {share: false});
      else
        this.photo.show('https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/img%2FFestivalMap.png?alt=media&token=1e43e8e6-ca91-40fa-abb3-d0c3441047d0',label, {share: false});

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

  getBeerActions(beer) {
    
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
          icon: 'thumbs-up',
          text: 'Thumbs Up',
          handler: () => {
            this.rateUp(beer.id);            
          }
        },{
          icon: 'thumbs-down',
          text: 'Thumbs Down',
          handler: () => {
            this.rateDown(beer.id);            
          }
        },{
          icon: 'remove',
          text: 'Remove Thumb',
          handler: () => {
            this.removeThumb(beer.id);            
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

  ionViewDidLoad() {
    console.log('ionViewDidLoad EventBreweryBeersPage');
    this.getChecklist();
  }

}
