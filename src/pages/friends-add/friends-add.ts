import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, ToastController } from 'ionic-angular';

import firebase from 'firebase';

@Component({
  selector: 'page-friends-add',
  templateUrl: 'friends-add.html'
})
export class FriendsAddPage {

  public uid:any;
  public friendSearch = new Array();
  public fbRef:any;

  constructor(public navCtrl: NavController, 
              public params: NavParams,
              public toastCtrl:ToastController,
              public view:ViewController) {

    this.uid = params.get('uid');
    this.fbRef = firebase.database();
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
    this.fbRef.ref('/users/'+uid+'/friendRequests/'+this.uid).set({
      uid:this.uid,
      requestDate: new Date().getTime(),
      priority: (new Date().getTime()) * -1
    }).then(success=>{
      this.presentToast('Friend Request Sent');
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
