import { Component } from '@angular/core';
import { Platform, NavController, NavParams } from 'ionic-angular';
import { Facebook } from 'ionic-native';
import { GooglePlus } from '@ionic-native/google-plus';
import { TwitterConnect } from '@ionic-native/twitter-connect';

import firebase from 'firebase';

import { AuthService } from '../../providers/auth-service';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  public user:any;
  public fbRef:any;
  public facebookActive:boolean = false;
  public googleActive:boolean = false;
  public twitterActive:boolean = false;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public platform: Platform,
              public googlePlus:GooglePlus,
              public twitter:TwitterConnect,
              public auth: AuthService) {
    this.user = this.auth.getUser();
    this.fbRef = firebase.database();
    //console.log('user',this.user);
    //console.log('profileData',this.user.providerData);
 
  }

  setProviders() {
    this.googleActive = false;
    this.facebookActive = false;
    this.twitterActive = false;

    for (var i = 0; i < this.user.providerData.length; i++) {


      if ( this.user.providerData[i].providerId === 'google.com')
        this.googleActive = true;

      if ( this.user.providerData[i].providerId === 'facebook.com')
        this.facebookActive = true;

      if ( this.user.providerData[i].providerId === 'twitter.com')
        this.twitterActive = true;        

    }
  }

  unlinkSocial(provider) {

    let providers = this.user.providerData;

    this.user.unlink(provider).then(success=>{
      let providerLabel = provider.replace('.com','');
      console.log('providerToRemove',providerLabel);
      this.fbRef.ref('users/'+this.user.uid+'/'+providerLabel+'Token').remove();
      //alert('unlinked '+provider);
      this.setProviders();
    }).catch(error=>{
      console.log('error unlinkSocial',error);
    });
  }

  mergeFacebook() {

    if (this.platform.is('cordova')) {
      Facebook.login(['public_profile']).then(facebookData => {
          let provider = firebase.auth.FacebookAuthProvider.credential(facebookData.authResponse.accessToken);
          this.user.link(provider).then(result => {
          this.auth.updateUserData(this.user,'facebook',facebookData.authResponse.accessToken);
          //console.log('result',result);
          this.setProviders();
        }).catch(error=> {
          console.log('error facebook merge',error);
        });
      });
    } else {
      let provider = new firebase.auth.FacebookAuthProvider();

      this.user.linkWithPopup(provider).then(resp=>{
        //console.log('resp',resp);
        this.auth.updateUserData(this.user,'facebook',resp.credential.accessToken);
        this.setProviders();
      }).catch(error=>{
          console.log('error facebook merge',error);
          //observer.error(error);
      });
    }
  }

  mergeGoogle() {

    if (this.platform.is('cordova')) {
      this.googlePlus.login({
          'webClientId':'925035513978-tv6qkm62kb4irdpjso6lprot1br1m5ut.apps.googleusercontent.com'
        }).then(success => {
          let provider = firebase.auth.GoogleAuthProvider.credential(success.idToken);
          this.user.link(provider).then(result => {
          this.auth.updateUserData(this.user,'google',success.idToken);
          console.log('result',result);
          this.setProviders();
        }).catch(error=> {
          console.log('error google merge',error);
        });
      });
    } else {

      let provider = new firebase.auth.GoogleAuthProvider();

      this.user.linkWithPopup(provider).then(resp=>{
        console.log('resp',resp);
        this.auth.updateUserData(this.user,'google',resp.credential.idToken);
        this.setProviders();
      }).catch(error=>{
          console.log('error google merge',error);
          //observer.error(error);
      });
    }
  }

  mergeTwitter() {

    if (this.platform.is('cordova')) {
      this.twitter.login().then(success => {
          let provider = firebase.auth.GoogleAuthProvider.credential(success.token,success.secret);
          this.user.link(provider).then(result => {
          this.auth.updateUserData(this.user,'twitter',success.token);
          console.log('result',result);
          this.setProviders();
        }).catch(error=> {
          console.log('error google merge',error);
        });
      });
    } else {

      let provider = new firebase.auth.TwitterAuthProvider();

      this.user.linkWithPopup(provider).then(resp=>{
        console.log('resp',resp);
        this.auth.updateUserData(this.user,'twitter',resp.credential.accessToken);
        this.setProviders();
      }).catch(error=>{
          console.log('error google merge',error);
          //observer.error(error);
      });
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');
    this.setProviders();
  }

}
