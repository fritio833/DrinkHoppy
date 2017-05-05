import { Component } from '@angular/core';
import { NavController, Events,LoadingController, ToastController, ModalController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { Storage } from '@ionic/storage';

import { SingletonService } from '../../providers/singleton-service';
import { GoogleService } from '../../providers/google-service';
import { BreweryService } from '../../providers/brewery-service';
import { DemoService } from '../../providers/demo-service';

import { ProfilePage } from '../profile/profile';
import { SearchMenuPage } from '../search-menu/search-menu';
import { SearchBeerPage } from '../search-beer/search-beer';
import { SearchLocationPage } from '../search-location/search-location';
import { SearchBreweriesPage } from '../search-breweries/search-breweries';
import { NotificationsPage } from '../notifications/notifications';
import { BeerDetailPage } from '../beer-detail/beer-detail';
import { LocationDetailPage } from '../location-detail/location-detail';
import { LeaderboardPage } from '../leaderboard/leaderboard';
import { PopularBeersPage } from '../popular-beers/popular-beers';
import { PopularLocationsPage } from '../popular-locations/popular-locations';
import { RandomBeersPage } from '../random-beers/random-beers';

import firebase from 'firebase';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public beers = new Array();
  public reviews = new Array();
  public profileIMG:string = 'images/default-profile.png';
  public displayName:string = '';
  public profileRef:any;
  public checkinCount:number;
  public joinedDate:any;
  public userPoints:number;
  public getProfile:boolean = true;
  public loading:any;
  public uid:any;
  public profile:any;
  public fbRef:any;
  public notifyCount:number;
  public notifyColor:string = 'white';
  public notifications:FirebaseListObservable<any>;
  public mostPopularBeer:any;
  public mostPopularLocation:any;

  constructor(public navCtrl: NavController, 
  	          public sing:SingletonService,
              public modalCtrl:ModalController,
              public loadingCtrl:LoadingController,
  	          public toastCtrl:ToastController,
              public beerAPI:BreweryService,
              public events:Events,
              public demo:DemoService,
              public geo:GoogleService,
              public angFire:AngularFire,
  	          public storage:Storage) {
    this.fbRef = firebase.database();
  }

  getProfileData() {

    let start = Date.now() / 1000;
    let end;

    this.storage.ready().then(()=>{
      this.storage.get('uid').then(uid=>{
        if (uid != null) {

          // Get Notification Count
          this.notifications = this.angFire.database.list('/notifications_users/'+ uid,{
            query:{
              orderByChild:'read',
              equalTo:false
            }
          });

          this.notifications.subscribe(resp=>{

            this.notifyCount = resp.length;

            if(this.notifyCount)
              this.notifyColor = 'yellow';
            else
              this.notifyColor = 'white';
          });          
        }
      });
    });
  }

  randomBeers() {
    this.showLoading();
    this.beerAPI.getRandomBeers().subscribe(beers=>{
      this.navCtrl.push(RandomBeersPage,{beers:beers,loading:this.loading});
    },error=>{
      console.log('error getRandomBeers',error);
      this.loading.dismiss();
    });
  }

  getLeaderboard() {
    this.navCtrl.push(LeaderboardPage);
  }

  doSearch(page) {

    switch(page) {

      case 'beers':
        this.navCtrl.push(SearchBeerPage); 
        break;
      case 'locations':
        this.navCtrl.push(SearchLocationPage,{searchType:'nearbysearch'});
        break;
      case 'breweries':
        this.navCtrl.push(SearchBreweriesPage);
        break;
      case 'bars':
        this.navCtrl.push(SearchLocationPage,{placeType:'bar',searchType:'textsearch'});
        break;                  
      default: console.log('not valid search');
    }
  }  


  getPopularBeer() {
      let location = this.sing.getLocation();
      let key = location.city.toLowerCase()+'-'+location.state.toLowerCase()+'-'+location.country.toLowerCase();
      this.fbRef.ref('/beer_by_city/'+key).orderByChild('checkinCount').once('child_added').then(snapshot=>{
        this.mostPopularBeer = snapshot.val();
        this.mostPopularBeer['key'] = snapshot.key;
        this.mostPopularBeer['rating']=0; 
        //console.log(this.mostPopularBeer);
        this.demo.getBeerRating(snapshot.key).subscribe(beerRating=>{
          this.mostPopularBeer['rating'] = beerRating;
        });
      });
  }

  getPopularLocation() {
      let location = this.sing.getLocation();
      let key = location.city.toLowerCase()+'-'+location.state.toLowerCase()+'-'+location.country.toLowerCase();
      this.fbRef.ref('/location_by_city/'+key).orderByChild('checkinCount').once('child_added').then(snapshot=>{
        this.mostPopularLocation = snapshot.val();
        this.mostPopularLocation['key'] = snapshot.key;
        if (this.mostPopularLocation['photo']!=null) {
          this.mostPopularLocation['photo'] = this.geo.getThumbnail(this.mostPopularLocation['photo'],100);
        }
      });
  }

  getPopular() {
    
    
    this.events.subscribe('gotGeo:true',geo=>{

      this.getPopularBeer();
      this.getPopularLocation();
      this.sing.popularLoaded = true;
    });

    if (this.sing.popularLoaded) {
      this.getPopularBeer();
      this.getPopularLocation();      
    }
  }


  getPopBeer(beerId) {
    this.navCtrl.push(BeerDetailPage,{beerId:beerId});
  }

  getPopLocation(placeId) {

    this.geo.placeDetail(placeId).subscribe((resp)=>{
      this.navCtrl.push(LocationDetailPage,{location:resp.result});
    });    
  }

  getAllPopLocation() {
    this.navCtrl.push(PopularLocationsPage);
  }

  getAllPopBeers() {
    this.navCtrl.push(PopularBeersPage);
  }


  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }

  goToProfile() {
    this.navCtrl.setRoot(ProfilePage);
  }

  startSearch() {
    this.navCtrl.push(SearchMenuPage);
  }

  showNotifications() {

    let modal = this.modalCtrl.create(NotificationsPage,{});
    modal.onDidDismiss(filter => {

    });
    modal.present();      
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Loading...'
    });
    this.loading.present();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');
    this.getProfileData();
  }

  
  ionViewWillEnter() {
    console.log('ionViewWillEnter HomePage');
    this.getPopular();
    
  }
  
}
