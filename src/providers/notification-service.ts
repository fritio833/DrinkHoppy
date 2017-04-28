import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { SingletonService } from './singleton-service';

import firebase from 'firebase';

@Injectable()
export class NotificationService {

  public fbRef:any;

  constructor(public sing:SingletonService) {
    console.log('Hello NotificationService Provider');
    this.fbRef = firebase.database();
  }

  notifyFriendRequest(user,friendId) {

   this.sing.getPriorityTime().subscribe(priorityTime=>{
   console.log('got here @ friendrequest');
   this.fbRef.ref('/notifications_users/'+friendId).push({
        from:user.uid,
        fromImg:user.photoURL,
        type:'friend-request',
        message: user.displayName + ' sent you a friend request',
        read:false,
        priority:priorityTime,
        timestamp:(Number(priorityTime) * -1)
      }).then(success=>{
        console.log('successful notifyFriendRequest');
      }).catch(error=>{
        console.log('error notifyFriendRequest',error);
      });
   },error=>{
     console.log('error notifyFriendRequest',error);
   });
    
  }

  notifyFriends(user,friends,location,beer,priorityTime,checkinKey) {
    var pushToks = new Array();
    var msg = user.displayName+ ' @' + location.name;
    //console.log('friends',friends);

    for (var i=0;i<friends.length;i++) {

      pushToks.push(friends[i].pushToken);
      this.fbRef.ref('/notifications_users/'+friends[i].uid).push({
        from:user.uid,
        fromImg:user.photoURL,
        type:'friend-checkin',
        message: msg,
        location:location,
        beer:beer,
        read:false,
        priority:priorityTime,
        timestamp:(priorityTime * -1),
        checkinKey:checkinKey
      }).then(success=>{
        console.log('successful notify users write');
      }).catch(error=>{
        console.log('error',error);
      });

    }


    this.fbRef.ref('/notifications/').push({
      uid:user.uid,
      userIMG:user.photoURL,
      type:'friends',
      pushTokens:pushToks,
      message:msg,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(success=>{
      console.log('successful notification write');
    }).catch(error=>{
      console.log('error notification write',error);
    });
  }

}
