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
      });

    }

    if (user.photoURL == '') {

    }

    this.fbRef.ref('/notifications/').push({
      uid:user.uid,
      userIMG:user.photoURL,
      type:'friends',
      pushTokens:pushToks,
      message:msg,
      timestam: firebase.database.ServerValue.TIMESTAMP
    });

  }

}
