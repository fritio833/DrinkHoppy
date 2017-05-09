import { Component } from '@angular/core';
import { NavController, ModalController, ToastController, AlertController, LoadingController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Geolocation } from 'ionic-native';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { SingletonService } from '../../providers/singleton-service';
import { AuthService } from '../../providers/auth-service';
import { NotificationService } from '../../providers/notification-service';

import firebase from 'firebase';

import { FavoritesPage } from '../favorites/favorites';
import { ProfileEditPage } from '../profile-edit/profile-edit';
import { BreweryVisitsPage } from '../brewery-visits/brewery-visits';
import { AchievementsPage } from '../achievements/achievements';

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
  public fbRef:any;
  public friendsRequested = new Array();
  public userIsFriend:boolean = false;
  public sentFriendRequest:boolean = false;
  public pointsByMonth:number = 0;
  public reputation:number = 0;
  public numOfUniqueBeers:number = 0;
  public uniqueBreweries:number = 0;

  constructor(public navCtrl: NavController, 
              public params: NavParams, 
              public sing: SingletonService,
              public alertCtrl: AlertController,
              public loadingCtrl:LoadingController,
              public modalCtrl:ModalController,
              public auth:AuthService,
              public angFire:AngularFire,
              public notify:NotificationService,
              public toastCtrl:ToastController,
              public storage:Storage) {

        this.user = this.auth.getUser();
        this.checkinsPerPage = sing.checkinsPerPage; 
        this.limit = new BehaviorSubject(this.checkinsPerPage);
        this.fbRef = firebase.database();
        this.isLookup = params.get('lookup');

        if (this.isLookup) {
          this.uid = params.get('uid');

          if (this.uid === this.user.uid)
            this.isLookup = false;  // Can't friend myself
          else {
            this.getRequestedFriendsList();
            this.getUserFriendsList();
          }
        } else {
          this.uid = this.user.uid; 
        }
  }

  viewVisitedBreweries() {
    this.navCtrl.push(BreweryVisitsPage,{lookup:this.isLookup,uid:this.uid,name:this.displayName});
  }

  getAchievements() {
    this.navCtrl.push(AchievementsPage,{uid:this.uid});
  }

  getUserProfile(uid) {

    if (uid != null) {
      
      this.profileRef = firebase.database().ref('users/'+uid).on('value', snapshot => {
        this.displayName = snapshot.val().name;
        if (snapshot.val().photo!=null && snapshot.val().photo !='')
          this.profileIMG = snapshot.val().photo;

        this.joinedDate = this.sing.getDateMonthDayYear(snapshot.val().dateCreated);
        this.checkinCount = snapshot.val().checkins;
        this.reputation = snapshot.val().reputation;
        this.numOfUniqueBeers = snapshot.val().numOfUniqueBeers;
        this.uniqueBreweries = snapshot.val().uniqueBreweriesVisited;
        this.points = snapshot.val().points * -1;
        console.log('rep',this.reputation);
        
        if (!this.isLookup && this.user!=null) {
          //console.log('currUser',this.user);
          this.isEmailVerified = this.user.emailVerified;
        }        
      });

      // Get points by month
      let timestamp = new Date().getTime();
      let dateMonthKey = this.sing.getMonthYearKey(timestamp);
      this.fbRef.ref('leaderboard/'+dateMonthKey+'/'+uid).on('value', snapshot => {

        if (snapshot.hasChildren())
          this.pointsByMonth = snapshot.val().points * -1
      });
    } 
  }

  getUserFriendsList() {
    this.fbRef.ref('/users/'+this.user.uid+'/friends').on('child_added',snapshot =>{
      //this.userFriendsList = snapshot.val().uid;
      if (this.uid === snapshot.val().uid)
        this.userIsFriend = true;
    });
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
    if (this.isLookup)
      this.navCtrl.push(FavoritesPage,{lookup:true,uid:this.uid,name:this.displayName});
    else
      this.navCtrl.push(FavoritesPage);
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Loading...'
    });
    this.loading.present();
  }

  repUp() {

    this.fbRef.ref('/users/'+this.uid+'/reppedMe/'+this.user.uid).transaction(value=>{
      return true
    },(error,committed,snapshot)=>{

      if (error) {
        if ((<Error>error).message === 'permission_denied') {
          console.log('permission_denied');
          this.presentToast("You already repped " + this.displayName);
        } else
          console.log('error',error);
      }

      if (committed) {
        this.fbRef.ref('/users/'+this.uid+'/reputation').transaction(value=>{
          this.presentToast("Positive Reputation Given to " + this.displayName);
          return (value||0)+1;
        });        
      }
    });
  }

  repDown() {

    this.fbRef.ref('/users/'+this.uid+'/reppedMe/'+this.user.uid).transaction(value=>{
      return true
    },(error,committed,snapshot)=>{

      if (error) {
        if ((<Error>error).message === 'permission_denied') {
          console.log('permission_denied');
          this.presentToast("You already repped " + this.displayName);
        } else
          console.log('error',error);
      }

      if (committed) {
        this.fbRef.ref('/users/'+this.uid+'/reputation').transaction(value=>{
          this.presentToast("Negative Reputation Given to " + this.displayName);
          return (value||0)-1;
        });        
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

  presentAlert() {
    let alert = this.alertCtrl.create({
      title: 'Email Sent',
      subTitle: 'Click link to verify',
      buttons: ['Dismiss']
    });
    alert.present();
  }

  sendFriendRequest() {

    this.fbRef.ref('/users/'+this.uid+'/friendRequests/'+this.user.uid).set({
      uid:this.user.uid,
      requestDate: new Date().getTime(),
      priority: (new Date().getTime()) * -1
    }).then(success=>{
      this.sentFriendRequest = true;
      //write notification to user
      this.notify.notifyFriendRequest(this.user,this.uid);

    }).catch(error=>{
      console.log('error sendFriendRequest',error);
    });    
    
  }

  getRequestedFriendsList() {
    //this.friendsRequested;
    this.fbRef.ref('/users/'+this.user.uid+'/friendRequests/').on('child_added',snapshot=>{
      //this.friendsRequested.push(snapshot.val().uid);
      //console.log('uid: '+this.uid+' - '+snapshot.val().uid);
      console.log('uid: ',snapshot.val());
      if (this.uid === snapshot.val().uid) {
        this.sentFriendRequest = true;
      }
      
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProfilePage');
    this.getUserProfile(this.uid);
    this.getCheckIns(this.uid);
    //console.log('lookup',this.isLookup);
    //console.log('friendReq',this.friendsRequested);
  }

}
