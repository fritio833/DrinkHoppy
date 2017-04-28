import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import firebase from 'firebase';

import { AuthService } from '../../providers/auth-service';
import { SingletonService } from '../../providers/singleton-service';
import { FriendsPage } from '../friends/friends';
import { CheckinDetailPage } from '../checkin-detail/checkin-detail';

@Component({
  selector: 'page-notifications',
  templateUrl: 'notifications.html'
})
export class NotificationsPage {

  public fbRef:any;
  public notifications:FirebaseListObservable<any>;
  public limit:any;
  public user:any;
  public queryable:boolean = true;
  public notifyPerPage:number = 10;
  public lastKey:string;
  public notificationLen:number = 1;
  public justReadArray = new Array();

  constructor(public navCtrl: NavController, 
              public view: ViewController,
              public angFire:AngularFire,
              public auth:AuthService,
              public sing:SingletonService,
              public navParams: NavParams) {

    this.fbRef = firebase.database();
    this.limit = new BehaviorSubject(10);
    this.user = this.auth.getUser();

  }

  getNotifications() {

    this.notifications = this.angFire.database.list('/notifications_users/'+this.user.uid,{
      query: {
        orderByChild: 'priority',
        limitToFirst: this.limit
      }
    });
    
    this.angFire.database.list('/notifications_users/'+this.user.uid,{
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
    
    this.notifications.subscribe(resp=>{
      this.notificationLen = resp.length;
      
      for(var i=0;i<resp.length;i++) {
        
        if(!resp[i].read) {
          this.justReadArray[resp[i].$key] = 1;
        }
      }

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

  setNotifyRead(key) {
    this.fbRef.ref('/notifications_users/'+ this.user.uid+'/'+key+'/read').transaction(value=>{
       if(!value)
         return true;
    });
  }

  getNotifyDetail(data) {
    if (data.type == 'friend-checkin') {
      this.navCtrl.push(CheckinDetailPage,{checkinKey:data.checkinKey,page:'users',checkinPageId:data.from});
    }

    if (data.type == 'friend-request') {
       this.navCtrl.push(FriendsPage,{mode:'requests'});
    }
  }

  getTimeDiff(prevTime) {
    let time = this.sing.timeDifference(new Date().getTime(),prevTime,true);
    if (time === '')
      return;
    else
     return this.sing.timeDifference(new Date().getTime(),prevTime,true);
  }

  close() {
    // mark unread notifications as read
    for (var key in this.justReadArray) {
      this.setNotifyRead(key);
    }
  	this.view.dismiss();
  }

  markAllRead() {
    this.fbRef.ref('/notifications_users/'+ this.user.uid)
      .orderByChild('read')
      .equalTo(false).on('child_added',snapshot=>{
        if (snapshot.key != null)
          this.setNotifyRead(snapshot.key);
      },error=>{
        console.log('error',error);
      },complete=>{
        console.log('complete');
      });
    //this.justReadArray = null;
  }

  getMoreNotifications(infiniteScroll) {
    setTimeout(() => {
      if (this.queryable)
        this.limit.next(this.limit.getValue()+this.notifyPerPage);

      infiniteScroll.complete();

      if (!this.queryable)
        infiniteScroll.enable(false);
    }, 1000);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad NotificationsPage');
    this.getNotifications();
  }

}
