import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, ToastController } from 'ionic-angular';

import firebase from 'firebase';

import { NotificationService } from '../../providers/notification-service';
import { AuthService } from '../../providers/auth-service';

@Component({
  selector: 'page-friends-add',
  templateUrl: 'friends-add.html'
})
export class FriendsAddPage {

  public uid:any;
  public friendSearch = new Array();
  public fbRef:any;
  public user:any;

  constructor(public navCtrl: NavController, 
              public params: NavParams,
              public toastCtrl:ToastController,
              public notify:NotificationService,
              public auth:AuthService,
              public view:ViewController) {

    this.uid = params.get('uid');
    this.fbRef = firebase.database();
    this.user = this.auth.getUser();
    console.log('uid',this.uid);
  }

  clearSearch(evt) {
    this.friendSearch = new Array();
  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }

  sendFriendRequest(uid) {
    this.fbRef.ref('/users/'+uid+'/friendRequests/'+this.user.uid).set({
      uid:this.uid,
      requestDate: new Date().getTime(),
      priority: (new Date().getTime()) * -1
    }).then(success=>{
      this.presentToast('Friend Request Sent');
      this.notify.notifyFriendRequest(this.user,uid);
    }).catch(error=>{
      console.log('error sendFriendRequest',error);
    });
  }

  doSearchFriends(evt) {
    let userName:string;

    if (evt.type != "input")
      return;
          
    if (evt.target.value.length > 2) {
      console.log('evt',evt.target.value);
      this.friendSearch = new Array();
      userName = evt.target.value.toLowerCase();
      
      this.fbRef.ref('/users/').on('child_added',snapshot=>{
        let snapName = snapshot.val().name.toLowerCase();
        let pattern = new RegExp(userName);
        console.log('patter: ' + pattern + ' snapName: ' + snapName);
        if (snapshot.val().uid !== this.uid && pattern.test(snapName))  {
          this.friendSearch.push({
            name:snapshot.val().name,
            photo:snapshot.val().photo,
            uid:snapshot.val().uid
          });
        }
        //console.log('friends',this.friendSearch);
      },error=>{
        console.log('error',error);
      },success=>{
        console.log('finish',success);
      });
    
    }
  }

  cancel() {
    this.view.dismiss();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad FriendsAddPage');
  }

}
