import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

import firebase from 'firebase';

import { SingletonService } from '../../providers/singleton-service';

import { ProfilePage } from '../profile/profile';

@Component({
  selector: 'page-leaderboard',
  templateUrl: 'leaderboard.html'
})
export class LeaderboardPage {

  public users = new Array();
  public timePeriod:string = 'month';
  public fbRef:any;

  constructor(public navCtrl: NavController, 
              public angFire:AngularFire,
              public sing:SingletonService, 
              public navParams: NavParams) {
    this.fbRef = firebase.database();
  
  }

  getMonthLeaderBoard() {
    this.users = new Array();
    let timestamp = new Date().getTime();
    let dateKey = this.sing.getMonthYearKey(timestamp);
    this.fbRef.ref('/leaderboard/'+dateKey).orderByChild('points').once('value').then(snapshot=>{
      snapshot.forEach(item=>{
        let leader = {};
        leader['uid'] = item.key;
        leader['points'] = item.val().points;

        this.fbRef.ref('/users/'+item.key).once('value').then(userSnap=>{
          
          if (userSnap.exists()) {
            leader['name'] = userSnap.val().name;
            if (userSnap.val().photo != null )
              leader['photo'] = userSnap.val().photo;
            else
              leader['photo'] = null;

            this.users.push(leader);  
          }        
        });
      });      
    });
  }

  getOverallLeaderBoard() {
      this.users = new Array();
      this.fbRef.ref('/users/').orderByChild('points').endAt(-1).once('value').then(userSnap=>{

        userSnap.forEach(item=>{
          let leader = {}
          leader['uid'] = item.key;
          leader['points'] = item.val().points;
          leader['name'] = item.val().name;

          if (item.val().photo != null )
            leader['photo'] = item.val().photo;
          else
            leader['photo'] = null;

          this.users.push(leader);  
        });    
      });      
  }

  getProfile(uid) {
    
    this.navCtrl.push(ProfilePage,{uid:uid,lookup:true});
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LeaderboardPage');
    this.getMonthLeaderBoard();
  }

}
