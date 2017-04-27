import { Component } from '@angular/core';
import { NavController, Events, LoadingController, ToastController, ModalController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { Storage } from '@ionic/storage';

import { SingletonService } from '../../providers/singleton-service';

import { ProfilePage } from '../profile/profile';
import { SearchMenuPage } from '../search-menu/search-menu';
import { SearchBeerPage } from '../search-beer/search-beer';
import { SearchLocationPage } from '../search-location/search-location';
import { SearchBreweriesPage } from '../search-breweries/search-breweries';
import { NotificationsPage } from '../notifications/notifications';

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

  constructor(public navCtrl: NavController, 
  	          public sing:SingletonService,
              public modalCtrl:ModalController,
              public loadingCtrl:LoadingController,
  	          public toastCtrl:ToastController,
              public events:Events,
              public angFire:AngularFire,
  	          public storage:Storage) {
  }

  getProfileData() {

    let start = Date.now() / 1000;
    let end;

    this.storage.ready().then(()=>{
      this.storage.get('uid').then(uid=>{
        if (uid != null) {
          this.profileRef = firebase.database().ref('users/'+uid).once('value').then(snapshot => {
            //console.log('snap',snapshot.val());
           
            this.checkinCount = snapshot.val().checkins;

            let date = new Date(snapshot.val().dateCreated);
            this.joinedDate = date.toDateString();
            this.joinedDate = this.joinedDate.substring(4,this.joinedDate.length);
            this.displayName = snapshot.val().name;
            this.userPoints = snapshot.val().points;
            if (snapshot.val().photo!=null && snapshot.val().photo !='')
              this.profileIMG = snapshot.val().photo;
          });
        }
      });
    });
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

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');
    this.getProfileData();
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

}
