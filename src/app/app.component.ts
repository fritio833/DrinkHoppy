import { Component, ViewChild } from '@angular/core';

import { Platform, MenuController, Events, Nav, AlertController,ToastController } from 'ionic-angular';
import { StatusBar, Splashscreen, Geolocation } from 'ionic-native';
import { Push, PushToken } from '@ionic/cloud-angular';
import firebase from 'firebase';

import { SingletonService } from '../providers/singleton-service';
import { GoogleService } from '../providers/google-service';
import { ConnectivityService } from '../providers/connectivity-service';
import { AuthService } from '../providers/auth-service';

import { LoginPage } from '../pages/login/login';
import { HomePage } from '../pages/home/home';
import { FavoritesPage } from '../pages/favorites/favorites';
import { ProfilePage } from '../pages/profile/profile';
import { Storage } from '@ionic/storage';
import { SearchMenuPage } from '../pages/search-menu/search-menu';
import { FriendsPage } from '../pages/friends/friends';



@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any;
  pages: Array<{title: string, component: any}>;
  login:any;
  comp:any;
  geoInterval:any;
  geoAttempt:number = 0;
  profileRef:any;
  profileIMG:string = 'images/default-profile.png';
  displayName:string = '';

  constructor(
    public platform: Platform,
    public menu: MenuController,
    public sing: SingletonService,
    public toastCtrl: ToastController,
    public auth: AuthService,
    public geo:GoogleService,
    public storage:Storage,
    public events:Events,
    public push:Push,
    public alertCtrl: AlertController,
    public conn:ConnectivityService
  ) {
    this.initializeApp();

    // set our app's pages
    this.pages = [
      //{ title: 'My Pub', component: MyPubPage },
      { title: 'Home', component: HomePage },
      { title: 'Search', component: SearchMenuPage },
      { title: 'Favorites', component: FavoritesPage },
      { title: 'Friends', component: FriendsPage },
      { title: 'Profile', component: ProfilePage }
    ];

    // Event Listener for logged in and out
    this.events.subscribe('user:loggedIn',userId=>{
      //console.log('userId Logged In',userId);
      this.getProfileData(userId);
    });

    this.events.subscribe('user:loggedOut',userId=>{
      console.log('user Logged Out',userId);
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      /*
      this.auth.isLoggedIn().then((status)=>{
        if (status)
          this.getGeolocation();
      });
      */      
      //this.getGeolocation();

      this.auth.isLoggedIn().then((status)=>{
        if (status) {
          this.rootPage = HomePage;
        } else {
          this.rootPage = LoginPage;
        }
      });

      this.sing.getGeolocation().subscribe(resp=>{
        this.setCityState(resp);
      },error=>{
        console.log('error',error);
      });
      
      // Push does not work on desktop
      if(this.platform.is('cordova')) {
        this.push.register().then((t: PushToken) => {
          return this.push.saveToken(t);
        }).then((t: PushToken) => {
          console.log('Token saved:', t.token);
        });

        this.push.rx.notification()
          .subscribe((msg) => {
            alert(msg.title + ': ' + msg.text);
        });
      }
      
      StatusBar.styleDefault();
      Splashscreen.hide();

    });
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }

  doLogout() {
  
    this.auth.logOut().then(allowed => {
      if (allowed) {
        this.nav.setRoot(LoginPage);
        this.presentToast('Log out was successful');
        this.menu.close(); 
      }
    });
  }

  setCityState(coords) {
    this.geo.reverseGeocodeLookup(coords.latitude,coords.longitude)
      .subscribe((success)=>{
      this.sing.geoCity = success.city;
      this.sing.geoState = success.state;
    });    
  }

  getProfileData(uid) {
    if (uid != null) {
      this.profileRef = firebase.database().ref('users/'+uid).on('value',snapshot => {
        console.log('snap',snapshot.val());
      
        this.displayName = snapshot.val().name;

        if (snapshot.val().photo!=null && snapshot.val().photo !='')
          this.profileIMG = snapshot.val().photo;
        else
          this.profileIMG = 'images/default-profile.png';
      });
    }
  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }

  presentAlert(msg) {
    let alert = this.alertCtrl.create({
      title: 'Message',
      subTitle: msg,
      buttons: ['Dismiss']
    });
    alert.present();
  }

  ionOpen() {
    console.log('menu open');
  }

}
