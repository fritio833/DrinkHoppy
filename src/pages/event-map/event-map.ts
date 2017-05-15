import { Component } from '@angular/core';
import { PhotoViewer } from '@ionic-native/photo-viewer';

import { NavController, NavParams, LoadingController,  ActionSheetController, ModalController } from 'ionic-angular';

import firebase from 'firebase';

import { BreweryService } from '../../providers/brewery-service';
import { GoogleService } from '../../providers/google-service';
import { AuthService } from '../../providers/auth-service';
import { SingletonService } from '../../providers/singleton-service';
import { ConnectivityService } from '../../providers/connectivity-service';

import { BeerDetailPage } from '../beer-detail/beer-detail';
import { BreweryDetailPage } from '../brewery-detail/brewery-detail';
import { EventBreweryBeersPage } from '../event-brewery-beers/event-brewery-beers';


@Component({
  selector: 'page-event-map',
  templateUrl: 'event-map.html'
})


export class EventMapPage {
  public choice = 'breweries';
  public eventBeers = new Array();
  public loading:any;
  public fbRef:any;
  public user:any;
  public approve = new Array();
  public groupedBeers = [];
  public isGrouped:boolean = false;

  constructor(public navCtrl:NavController, 
              public navParams:NavParams,
              public beerAPI: BreweryService,
              public geo:GoogleService,
              public loadingCtrl:LoadingController,
              public modalCtrl:ModalController,
              public auth:AuthService,
              public sing:SingletonService,
              public conn:ConnectivityService,
              public actionCtrl:ActionSheetController,
              public photo:PhotoViewer) {

    this.fbRef = firebase.database();
    this.user = this.auth.getUser();
  }


  getMap(label) {

    if (label==null)
      this.photo.show('https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/img%2FFestivalMap.png?alt=media&token=1e43e8e6-ca91-40fa-abb3-d0c3441047d0','Emeral Coast Beerfestival', {share: false});
    else
      this.photo.show('https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/img%2FFestivalMap.png?alt=media&token=1e43e8e6-ca91-40fa-abb3-d0c3441047d0',label, {share: false});
  
  }

  getBeerList() {

      this.showLoading();
      this.beerAPI.loadBreweryBeers('BBE5WM').subscribe(beers=>{
        this.loading.dismiss();
        let beerList = [];
        beerList = beers.data;
        for (var i = 0; i < beerList.length; i++) {
          beerList[i]['booth'] = Math.random() * 60 + 1;
        }

        let modal = this.modalCtrl.create(EventBreweryBeersPage,{beers:beerList});
        modal.onDidDismiss(()=> {});
        modal.present();
      },error=>{
        console.log('error getBreweryBeers',error);
        this.loading.dismiss().catch(() => {});
        this.sing.presentOffline();
      });    

  }

  getDetail() {

      this.showLoading();
      this.geo.placeDetail("ChIJG_d8TP5eJ4YR6wK6RwXBFkc").subscribe((resp)=>{
      
        this.beerAPI.getBreweryDetail("BBE5WM","1xB2B8").subscribe(pub=>{
          console.log('pub',pub);
          this.loading.dismiss();
          this.navCtrl.push(BreweryDetailPage,{brewery:pub['detail'],beers:pub['beers'],place:resp['result']});        
        },error=>{
          console.log('error getBrewery',error);
          this.loading.dismiss().catch(() => {});
          this.sing.presentOffline();
          //this.presentToast('Could not connect. Check connection.');         
        });

      },error=>{
          console.log('error getBreweryFromGoogle',error);
          this.loading.dismiss().catch(() => {});
          this.sing.presentOffline();
          //this.presentToast('Could not connect. Check connection.');      
      });

  }

  getBeerDetail(beerDbId) {

      this.navCtrl.push(BeerDetailPage,{beerId:beerDbId});
  }  

  getEventBeers() {

      this.showLoading();
      this.beerAPI.loadBreweryBeers('BBE5WM').subscribe(beers=>{
        //console.log('beers',beers);
        let beerList = [];
        beerList = beers.data;
        for (var i = 0; i < beerList.length; i++) {
          beerList[i]['booth'] = Math.round(Math.random() * 60 + 1);
          beerList[i]['abv'] = parseFloat(beerList[i]['abv']);
        }
              
        this.eventBeers = beerList;
        this.isGrouped = true;
        this.eventBeers.sort(this.SORT_BEER_STYLE);
        this.groupBeerStyle(this.eventBeers);
        this.loading.dismiss().catch(() => {}); 
      },error=>{
        console.log('error getEventBeers');
        this.loading.dismiss().catch(() => {});
        this.sing.presentOffline();
      });

  }

  SORT_BEER_NAME(a,b) {

    if (a.nameDisplay < b.nameDisplay)
      return -1;
    if (a.nameDisplay > b.nameDisplay)
      return 1;
    return 0;
  }


  SORT_BEER_STYLE(a,b) {

    if (a.style.shortName < b.style.shortName)
      return -1;
    if (a.style.shortName > b.style.shortName)
      return 1;
    return 0;

  }   
  
  SORT_ABV_DESC(a,b) {

    if (a.abv > b.abv)
      return -1;
    if (a.abv < b.abv)
      return 1;
    return 0;

  }

  getSorActions() {
    let actionSheet = this.actionCtrl.create({
      title: 'Sort Beers By',
      buttons: [
        {
          text: 'Name',
          handler: () => {
            this.isGrouped = true;
            this.eventBeers.sort(this.SORT_BEER_NAME);
            this.groupBeerName(this.eventBeers);
          }
        },{
          text: 'ABV Desc',
          handler: () => {
            this.isGrouped = false;
            this.eventBeers.sort(this.SORT_ABV_DESC);            
          }
        },{
          text: 'Beer Style',
          handler: () => {
            this.isGrouped = true;
            this.eventBeers.sort(this.SORT_BEER_STYLE);
            this.groupBeerStyle(this.eventBeers);         
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

  groupBeerStyle(beers){
      
      let sortedBeers = beers;
      let currentStyle = false;
      let currentBeers = [];
      this.groupedBeers = [];

      sortedBeers.forEach((value, index) => {

          if(value.style.shortName != currentStyle){

              currentStyle = value.style.shortName;

              let newGroup = {
                  style: currentStyle,
                  beers: []
              };

              currentBeers = newGroup.beers;
              this.groupedBeers.push(newGroup);

          } 
          currentBeers.push(value);
      });
  }

  groupBeerName(beers){
      
      let sortedBeers = beers;
      let currentLetter = false;
      let currentBeers = [];
      this.groupedBeers = [];

      sortedBeers.forEach((value, index) => {

          if(value.name.charAt(0) != currentLetter){

              currentLetter = value.name.charAt(0);

              let newGroup = {
                  style: currentLetter,
                  beers: []
              };

              currentBeers = newGroup.beers;
              this.groupedBeers.push(newGroup);

          } 
          currentBeers.push(value);
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

  getChecklist() {
    this.approve = [];
    this.fbRef.ref('beer_events/fGgpIu/'+this.user.uid).once('value').then(snapshot=>{
      snapshot.forEach(item=>{
        this.approve[item.key] = item.val().approve;
      });
      console.log('approve',this.approve);
    });
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

  getBeerListActions(beer) {
    
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
            this.getMap('Booth #' + beer.booth + ' - '+beer.name);            
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

  showLoading() {
    this.loading = this.loadingCtrl.create({});
    this.loading.present();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EventMapPage');
    //this.getEventBeers();
    this.getChecklist();
  }

}
