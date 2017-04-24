import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Geolocation } from 'ionic-native';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { SingletonService } from '../../providers/singleton-service';
import { FavoritesPage } from '../favorites/favorites';
import { ProfileEditPage } from '../profile-edit/profile-edit';

import { AuthService } from '../../providers/auth-service';

import firebase from 'firebase';

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html'
})
export class ProfilePage {

  public profileIMG:string = 'images/default-profile.png';
  public profileRef:any;
  public displayName:string;
  public joinedDate:any;
  public checkinCount:number;
  public loading:any;
  public checkins:FirebaseListObservable<any>;
  public checkinLen:number;  
  public isEmailVerified:any;
  public user:any;
  public uid:any;
  public points:any;
  public checkinsPerPage:number;
  public limit:any;
  public lastKey:string;
  public queryable:boolean = true;
  public isLookup:boolean = false;

  constructor(public navCtrl: NavController, 
              public params: NavParams, 
              public sing: SingletonService,
              public alertCtrl: AlertController,
              public loadingCtrl:LoadingController,
              public modalCtrl:ModalController,
              public auth:AuthService,
              public angFire:AngularFire,
              public storage:Storage) {

        this.user = this.auth.getUser();
        this.checkinsPerPage = sing.checkinsPerPage; 
        this.limit = new BehaviorSubject(this.checkinsPerPage);
        
        this.isLookup = params.get('lookup');

        if (this.isLookup) {
          this.uid = params.get('uid');
          if (this.uid === this.user.id)
            this.isLookup = false;  // Can't friend myself
        } else {
          this.uid = this.user.uid;
        }
  }

  getUserProfile(uid) {

    this.showLoading();
    if (uid != null) {
      
      this.profileRef = firebase.database().ref('users/'+uid).on('value', snapshot => {
        this.displayName = snapshot.val().name;
        if (snapshot.val().photo!=null && snapshot.val().photo !='')
          this.profileIMG = snapshot.val().photo;

        this.joinedDate = this.sing.getDateMonthDayYear(snapshot.val().dateCreated);
        this.checkinCount = snapshot.val().checkins;
        this.points = snapshot.val().points;
        
        if (!this.isLookup && this.user!=null) {
          //console.log('currUser',this.user);
          this.isEmailVerified = this.user.emailVerified;
        }
        this.loading.dismiss();            
      });
    } 
  }

  getCheckIns(uid) {
    this.checkins =  this.angFire.database.list('/checkin/users/'+uid,{
      query:{
        orderByChild:'priority',
        limitToFirst: this.limit
      }
    });
  
    this.angFire.database.list('/checkin/users/'+uid,{
      query: {
        orderByChild: 'priority',
        limitToLast: 1
      }
    }).subscribe((data) => {
      // Found the last key
      if (data.length > 0) {
        this.lastKey = data[0].$key;
      } else {
        this.lastKey = '';
      }
    });
  
    this.checkins.subscribe(resp=>{
      this.checkinLen = resp.length;
      //console.log('resp',resp);
      if (resp.length > 0) {
        // If the last key in the list equals the last key in the database
        if (resp[resp.length - 1].$key === this.lastKey) {
          this.queryable = false;
        } else {
          this.queryable = true;
        }
      }      
    });
  }

  getMoreCheckins(infiniteScroll) {
   //console.log('inf',infiniteScroll);
    setTimeout(() => {
      if (this.queryable)
        this.limit.next(this.limit.getValue()+this.checkinsPerPage);

        infiniteScroll.complete();

      if (!this.queryable)
        infiniteScroll.enable(false);
    }, 1000);
  }  

  editProfile() {
    let modal = this.modalCtrl.create(ProfileEditPage,{uid:this.uid});
    modal.onDidDismiss(resp => {
      console.log('resp',resp);
    });
    modal.present();   
  }

  sendVerifyEmail() {
    this.user.sendEmailVerification();
    this.presentAlert();
  }

  goToFavorites() {
    this.navCtrl.push(FavoritesPage);
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Loading...'
    });
    this.loading.present();
  }   

  presentAlert() {
    let alert = this.alertCtrl.create({
      title: 'Email Sent',
      subTitle: 'Click link to verify',
      buttons: ['Dismiss']
    });
    alert.present();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProfilePage');
    this.getUserProfile(this.uid);
    this.getCheckIns(this.uid);
  }

}
