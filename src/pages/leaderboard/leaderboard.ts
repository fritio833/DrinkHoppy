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

  public users:FirebaseListObservable<any>;
  public timePeriod:string = 'month';

  constructor(public navCtrl: NavController, 
              public angFire:AngularFire,
              public sing:SingletonService, 
              public navParams: NavParams) {
  
  }

  getMonthLeaderBoard() {
    let timestamp = new Date().getTime();
    let dateKey = this.sing.getMonthYearKey(timestamp);
    this.users = this.angFire.database.list('/leaderboard/'+dateKey,{
      query: {
        orderByChild: 'points',
        endAt: -1
      }
    });    
  }

  getOverallLeaderBoard() {
      this.users = this.angFire.database.list('/users/',{
        query: {
          orderByChild: 'points',
          endAt: -1
        }
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
