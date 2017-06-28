import { Component } from '@angular/core';
import { NavController, Events, LoadingController,AlertController, ToastController, ModalController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { Storage } from '@ionic/storage';
import { Diagnostic } from '@ionic-native/diagnostic';

import firebase from 'firebase';

import { SingletonService } from '../../providers/singleton-service';
import { GoogleService } from '../../providers/google-service';
import { BreweryService } from '../../providers/brewery-service';
import { DemoService } from '../../providers/demo-service';
import { AchievementsService } from '../../providers/achievements-service';

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
import { EventInfoPage } from '../event-info/event-info';
import { SelectLocationPage } from '../select-location/select-location';
import { AchievementsPage } from '../achievements/achievements';
import { ContactPage } from '../contact/contact';


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
  public achievement:any;
  public isOnline:boolean = false;
  public geoFailed:boolean = false;

  constructor(public navCtrl: NavController, 
  	          public sing:SingletonService,
              public modalCtrl:ModalController,
              public loadingCtrl:LoadingController,
  	          public toastCtrl:ToastController,
              public beerAPI:BreweryService,
              public alertCtrl:AlertController,
              public events:Events,
              public demo:DemoService,
              public geo:GoogleService,
              public angFire:AngularFire,
              public diagnostic: Diagnostic,
              public achieve:AchievementsService,
  	          public storage:Storage) {
    this.fbRef = firebase.database();
    this.events.subscribe('online:status',status=>{
      this.isOnline = status;
    });

    this.events.subscribe('gotGeo:false',geo=>{
      this.geoFailed = true;
    });
    
    this.isOnline = this.sing.online;   
  }

  getProfileData() {

    let start = Date.now() / 1000;
    let end;

    this.storage.ready().then(()=>{
      this.storage.get('uid').then(uid=>{
        if (uid != null) {

          this.uid = uid;

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

          this.achieve.getNextAchievement(uid).then(resp=>{
            this.achievement = resp;
          });          
        }
      });
    });
  }

  changeCity() {
    if (this.sing.online) {
      let modal = this.modalCtrl.create(SelectLocationPage);
      modal.onDidDismiss(citySet => {
        if (citySet) {
          console.log('getLocation',this.sing.getLocation());
          this.getPopular();
        }

      });
      modal.present();
    } else {
      this.sing.showNetworkAlert();
    } 
  }

  randomBeers() {
    if (this.sing.online) {
      this.showLoading();
      this.beerAPI.getRandomBeers().subscribe(beers=>{
        this.navCtrl.push(RandomBeersPage,{beers:beers,loading:this.loading});
      },error=>{
        console.log('error getRandomBeers',error);
        this.loading.dismiss();
      });
    } else {
      this.sing.showNetworkAlert();
    }
  }

  demoAlert() {
    let networkAlert = this.alertCtrl.create({
      title: 'Alpha Test',
      message: 'Please give us feedback on bugs or improvements. Thanks for helping us test our App.',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {}
        },
        {
          text: 'Leave Feedback',
          handler: () => {
            this.navCtrl.push(ContactPage);
          }
        }
      ]
    });
    networkAlert.present();
  }

  getLeaderboard() {
    this.navCtrl.push(LeaderboardPage);
  }

  doSearch(page) {

    if (this.sing.online) {
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
    } else {
      this.sing.showNetworkAlert();
    }
  }  


  getPopularBeer() {
      let location = this.sing.getLocation();
      console.log('locatin',location);
      let key =  this.sing.getCityStateKey(location.city,location.state,location.country);
      console.log('key',key);
      this.fbRef.ref('/beer_by_city/'+key).orderByChild('checkinCount').once('child_added').then(snapshot=>{
        this.mostPopularBeer = snapshot.val();
        this.mostPopularBeer['key'] = snapshot.key;
        this.mostPopularBeer['rating']=0;
        this.demo.getBeerRating(snapshot.key).subscribe(beerRating=>{
          this.mostPopularBeer['rating'] = beerRating;
        });
      });

      this.fbRef.ref('/beer_by_city/'+key).once('value',snapshot=>{
        if (!snapshot.exists())
         this.mostPopularBeer = null;
      });      
  }

  getPopularLocation() {
      let location = this.sing.getLocation();
      let key =  this.sing.getCityStateKey(location.city,location.state,location.country);

      this.fbRef.ref('/location_by_city/'+key).orderByChild('checkinCount').once('child_added').then(snapshot=>{        
        this.mostPopularLocation = snapshot.val();
        this.mostPopularLocation['key'] = snapshot.key;
        if (this.mostPopularLocation['photo']!=null) {
          this.mostPopularLocation['photo'] = this.geo.getThumbnail(this.mostPopularLocation['photo'],100);
        }
      });

      this.fbRef.ref('/location_by_city/'+key).once('value',snapshot=>{
        if (!snapshot.exists())
         this.mostPopularLocation = null;
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

 getBeerEventInfo() {
   this.navCtrl.push(EventInfoPage);
 }

  getPopBeer(beerId) {
    if (this.sing.online)
      this.navCtrl.push(BeerDetailPage,{beerId:beerId});
    else
      this.sing.showNetworkAlert();
  }

  getPopLocation(placeId) {
    if (this.sing.online) {
      this.geo.placeDetail(placeId).subscribe((resp)=>{
        this.navCtrl.push(LocationDetailPage,{location:resp.result});
      });
    } else {
      this.sing.showNetworkAlert();
    }    
  }

  getAllPopLocation() {
    if (this.sing.online)
      this.navCtrl.push(PopularLocationsPage);
    else
      this.sing.showNetworkAlert()
  }

  getAllPopBeers() {
    if (this.sing.online)
      this.navCtrl.push(PopularBeersPage);
    else
      this.sing.showNetworkAlert();
  }


  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }

  startSearch() {
    this.navCtrl.push(SearchMenuPage);
  }

  showNotifications() {
    if (this.sing.online) {
      let modal = this.modalCtrl.create(NotificationsPage,{});
      modal.onDidDismiss(filter => {

      });
      modal.present();
    } else {
      this.sing.showNetworkAlert();
    }
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Loading...'
    });
    this.loading.present();
  }

  seeAchievements() {
    if (this.sing.online)
      this.navCtrl.push(AchievementsPage,{uid:this.uid});
    else
      this.sing.showNetworkAlert();
  }
  /*
  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');
    this.getProfileData();
    
  }
  */

  setLocation() {
      // Get geolocation.  Sets our app.
      this.sing.getGeolocation().subscribe(resp=>{
        this.setCityState(resp);
        this.geoFailed = false;
      },error=>{
        console.log('error',error);
        // Attempt to get geo with low accuracy
        this.sing.getGeolocationLow().subscribe(lowResp=>{
          this.setCityState(lowResp);
          this.geoFailed = false;
        },error=>{
          console.log('error',error);
           this.events.publish('gotGeo:false',null);
          //this.presentNoGPSAlert();
        });
      }); 
  }

  setCityState(coords) {
    this.geo.reverseGeocodeLookup(coords.latitude,coords.longitude)
      .subscribe((success)=>{
      this.sing.geoCity = success.city;
      this.sing.geoState = success.state;
      this.sing.geoCountry = success.country;
      this.sing.geoLat = coords.latitude;
      this.sing.geoLng = coords.longitude;
      setTimeout(()=>{
        this.events.publish('gotGeo:true',{city:this.sing.geoCity,state:this.sing.geoState,country:this.sing.geoCountry});
      },1000);
      
    },error=>{
      console.log('error',error);
      //this.presentNoGPSAlert();
    });    
  }
  
  ionViewWillEnter() {
    console.log('ionViewWillEnter HomePage');
    this.getPopular();
    this.getProfileData();
  }

  ionViewWillLeave() {
    if (this.notifications) {
      this.notifications = null;
    }
  }  
  
}
