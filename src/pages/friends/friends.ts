import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, ModalController } from 'ionic-angular';

import { SingletonService } from '../../providers/singleton-service';
import { AuthService } from '../../providers/auth-service';

import { ProfilePage } from '../profile/profile';
import { FriendsAddPage } from '../friends-add/friends-add';

import firebase from 'firebase';

@Component({
  selector: 'page-friends',
  templateUrl: 'friends.html'
})
export class FriendsPage {
  public uid:any;
  public user:any;
  public fbRef:any;
  public friendReq = new Array();
  public userFriends = new Array();
  public notificationColor:string ="white";
  public icons:string = 'friends';
  public friendSearch = new Array();
  public mode:string;


  constructor(public navCtrl: NavController, 
              public params: NavParams, 
              public sing: SingletonService,
              public modalCtrl:ModalController,
              public view:ViewController,
              public auth: AuthService) {

    this.fbRef = firebase.database();
    this.user = this.auth.getUser();
    this.getFriendRequests();
    this.mode = params.get('mode');

    if (this.mode == 'requests')
      this.icons = 'requests';

    if (this.mode == 'checkin') {
      this.icons = 'checkin';
    }
  }

  getFriendRequests() {
    
    var userRef = firebase.database();
    this.friendReq = new Array();
    this.fbRef.ref('/users/'+this.user.uid+'/friendRequests').orderByChild('priority').on('child_added',snapshot=>{
      //this.friendReq.push(snapshot.val());
      let user = userRef.ref('/users/'+snapshot.key);
      let fn = user.once('value').then(userSnap=>{
        //console.log('user',userSnap.val());
        this.friendReq.push({
          uid:userSnap.val().uid,
          name:userSnap.val().name,
          photo:userSnap.val().photo,
          dateSent:this.sing.getDateMonthDayYear(snapshot.val().requestDate)
        })
      });
    });

    
    if (this.friendReq.length) {
      this.notificationColor = 'yellow';
    }
  }

  setCheckinUID(uid,evt) {
    console.log('uid',uid);
    console.log('evt',evt);
  } 

  clearSearch(evt) {
    this.getUserFriends();
  }

  cancel() {
    this.view.dismiss();
  }

  sendFriendRequest(uid) {
    this.fbRef.ref('/users/'+uid+'/friendRequests/'+this.user.uid).set({
      uid:this.user.uid,
      requestDate: new Date().getTime(),
      priority: (new Date().getTime()) * -1
    });
  }

  doSearchFriends(evt) {
    let userName:string;

     if (evt.type != "input")
      return;
         
    if (evt.target.value.length > 2) {
      console.log('evt',evt.target.value);
      this.userFriends = new Array();
      let userRef = firebase.database();
      userName = evt.target.value.toLowerCase();
      
      this.fbRef.ref('/users/'+this.user.uid+'/friends/').on('child_added',snapshot=>{


        //console.log('snap',snapshot.val().uid);
        // console.log('snapname: ' + snapName + ' patter: ' + pattern);                                

        userRef.ref('/users/'+snapshot.val().uid).on('value',userSnap=>{
          console.log('user',userSnap.val());
          
          let snapName = userSnap.val().name.toLowerCase();
          let pattern = new RegExp(userName.toLowerCase());

          console.log('snap',userSnap.val());
          console.log('snapname: ' + snapName + ' patter: ' + pattern);

          if (userSnap.val().uid !== this.user.uid && pattern.test(snapName))  {

            this.userFriends.push({
              name:userSnap.val().name,
              photo:userSnap.val().photo,
              uid:userSnap.val().uid
            });
          
            console.log('userFriends',this.userFriends);
          }
          
        });

      });
    }
  }

  unfriend(uid) {
    this.fbRef.ref('/users/'+this.user.uid+'/friends/'+uid).remove();
    this.fbRef.ref('/users/'+uid+'/friends/'+this.user.uid).remove();
    this.getUserFriends();
  }

  removeRequest(uid) {
    console.log('uid',uid);
    this.fbRef.ref('/users/'+this.user.uid+'/friendRequests/'+uid).remove();
    //this.fbRef.ref('/users/'+uid+'/friends/'+this.user.uid).remove();
    this.getFriendRequests();    
  }


  getUserProfile(uid) {
    this.navCtrl.push(ProfilePage,{uid:uid,lookup:true});
  }  
  
  searchFriend() {
    let modal = this.modalCtrl.create(FriendsAddPage,{uid:this.user.uid});
    modal.onDidDismiss(beer => {

    });
    modal.present();    
  }
  addFriend(uid) {
    console.log('uid',uid);
    this.fbRef.ref('/users/'+this.user.uid+'/friends/'+uid).set({
      uid:uid,
      acceptDate: new Date().getTime(),
      priority: (new Date().getTime()) * -1
    }).then(success=>{
      this.fbRef.ref('/users/'+this.user.uid+'/friendRequests/'+uid).remove();

      //Add friend to the one who sent it
      this.fbRef.ref('/users/'+uid+'/friends/'+this.user.uid).set({
            uid:this.user.uid,
            acceptDate: new Date().getTime(),
            priority: (new Date().getTime()) * -1
      }).then(resp=>{

          this.fbRef.ref('/users/'+uid+'/friends/'+this.user.uid).set({
            uid:this.user.uid,
            acceptDate: new Date().getTime(),
            priority: (new Date().getTime()) * -1
          })
      });

      this.getFriendRequests();
    });    
  }

  setCheckinFriends() {
    //console.log('checkinFriends',this.userFriends);
    let checkinUsers = new Array();// = this.userFriends;
    for(var i = 0; i < this.userFriends.length; i++) {
      if (this.userFriends[i].checked === true)
        checkinUsers.push(this.userFriends[i]);
    }

    this.view.dismiss(checkinUsers);
    //console.log(checkinUsers);
  }

  getUserFriends() {
    var userRef = firebase.database();
    this.userFriends = new Array();
    this.fbRef.ref('/users/'+this.user.uid+'/friends')
      .orderByChild('priority')
      .on('child_added',snapshot=>{

      let user = userRef.ref('/users/'+snapshot.key);
      let fn = user.once('value').then(userSnap=>{
        //console.log('user',userSnap.val());
        this.userFriends.push({
          uid:userSnap.val().uid,
          name:userSnap.val().name,
          photo:userSnap.val().photo,
          pushToken:userSnap.val().pushToken,
          checked:false,
          dateAccept:this.sing.getDateMonthDayYear(snapshot.val().acceptDate)
        })
      });
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad FriendsPage');
    this.getUserFriends();
    //console.log('user',this.user);
  }

}
