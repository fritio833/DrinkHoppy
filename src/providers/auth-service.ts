import { Injectable } from '@angular/core';
import { Platform, App, Events } from 'ionic-angular';

import { Observable } from 'rxjs/Observable';
import { AuthProviders, AuthMethods, AngularFire  } from 'angularfire2';
import { Geolocation } from 'ionic-native';
import { Facebook } from 'ionic-native';
import { GooglePlus } from '@ionic-native/google-plus';
import { TwitterConnect } from '@ionic-native/twitter-connect';
import firebase from 'firebase';

import 'rxjs/add/operator/map';
import { Storage } from '@ionic/storage';

import { SingletonService } from './singleton-service';


export class User {
  name: string;
  email: string;
 
  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}
 
@Injectable()
export class AuthService {
  public currentUser: User;
  public auth:any;
  public userRef:any;
  public userExistsRef:any;
  public loggedIn:boolean = false;
  public user:any;

  constructor(public sing:SingletonService,
              public angFire:AngularFire,
              public storage:Storage,
              public platform:Platform,
              public googlePlus:GooglePlus,
              public twitter:TwitterConnect,
              public events:Events,
              public app:App) {
    this.auth = firebase.auth();
    this.userRef = firebase.database();
    this.userExistsRef = firebase.database();
    
    firebase.auth().onAuthStateChanged((_currentUser) => {
        if (_currentUser && !this.loggedIn) {
          console.log("User " + _currentUser.uid);
          this.user = _currentUser;
          //console.log('user',_currentUser);
          this.events.publish('user:loggedIn',this.user.uid);    
        } else {
          this.user = null;
          this.events.publish('user:loggedOut',null);
          console.log("AUTH: User is logged out");
        }
    });
  }

  public getUser() {
    return this.user;
  }

  public loginEmail(credentials) {
    return new Observable(observer => {
      firebase.auth().signInWithEmailAndPassword(credentials.email,credentials.password).then(response=>{
        this.updateUserData(response);
        this.storage.set('uid',response.uid);
        observer.next(true);
      }).catch(error=> {
        // Handle Errors here.
        observer.error(error);        
      });
    });
  }

  public updateUserData(resp,provider?,providerTok?) {
    let timestamp = firebase.database.ServerValue.TIMESTAMP;
    let updateData = {dateLoggedIn:timestamp};

    if (provider!=null && providerTok!=null) {
      updateData[provider+'Token'] = providerTok;
    }
    this.userRef.ref('users/' + resp.uid).update(updateData);    
  }

  public writeUserData(resp,provider,providerTok?,credName?) {
    let timestamp = firebase.database.ServerValue.TIMESTAMP;
    let displayName = null;
    let photoURL = null;
    let userHomeTownCity = this.sing.geoCity;
    let userHomeTownState = this.sing.geoState;
    let userHomeTownCountry = this.sing.geoCountry;
    let locationKey = '';

    if (userHomeTownCity!=null)
      locationKey = this.sing.getCityStateKey(userHomeTownCity,userHomeTownState,userHomeTownCountry);

    userHomeTownCity = this.sing.geoCity;
    if (credName!=null) {
      displayName = credName;
    } else {
      displayName = resp.displayName;
    }

    if (resp.photoURL != null)
      photoURL = resp.photoURL;
    else
      photoURL = '';

    let newUserData = {
      uid:resp.uid,
      name:displayName,
      nameLower:displayName.toLowerCase(),
      email:resp.email,
      dateCreated:timestamp,
      dateLoggedIn:timestamp,
      provider:provider,
      photo:photoURL,
      emailVerified: resp.emailVerified,
      lastBeerCheckin:'',
      points:0,
      reputation:0,
      checkins:0,
      city:userHomeTownCity,
      state:userHomeTownState,
      country:userHomeTownCountry,
      locationKey:locationKey,
      banned:0,
      role:'user'      
    };

    newUserData[provider+'Token'] = providerTok;


    this.userRef.ref('users/' + resp.uid).set(newUserData);
  }
   
  public signupEmail(cred) {
    return new Observable(observer => {

      firebase.auth().createUserWithEmailAndPassword(cred.email.value,cred.pword.value).then(resp=>{
        //console.log('resp',resp);
        this.auth.currentUser.sendEmailVerification();
        this.storage.set('uid',resp.uid);
        this.writeUserData(resp,'email','',cred.name.value);

        resp.updateProfile({
          displayName: cred.name.value
        }).then(function() {
          // Update successful.
        }, function(error) {
          // An error happened.
        });

        observer.next(resp);
      }).catch(error=> {
        // Handle Errors here.
        console.log('error',error);
        observer.error(error);
      });

    });
  }

  // Can't get email.  Must apply to Twitter to be whitelisted or find access on Fabric to turn email flag on.
  
  public loginTwitter() {
    return Observable.create(observer => { 
      
      if (this.platform.is('cordova')) {
        this.twitter.login().then(resp=>{
          console.log('twitter resp',resp);
          let provider = firebase.auth.TwitterAuthProvider.credential(resp.token,resp.secret);
          this.setUserData(provider,resp.token,'twitter').subscribe(success=>{
            observer.next(success);
          });        
        },error=>{
          console.log('error loginTwitterPlugin',error);
        });
      } else {
        let provider = new firebase.auth.TwitterAuthProvider();
        firebase.auth().signInWithPopup(provider).then(resp=>{
          console.log('twitter keys',resp);
          let providerTwitter = firebase.auth.TwitterAuthProvider.credential(resp.credential.accessToken,resp.credential.secret);
          this.setUserData(providerTwitter,resp.credential.accessToken,'twitter').subscribe(success=>{
            observer.next(success);
          });
        }).catch(error=>{
          console.log('error signInWithPopup',error);
        });        
      }
    });    
  }

  public loginGoogle() {
    return Observable.create(observer => { 
      
      if (this.platform.is('cordova')) {
        this.googlePlus.login({
          'webClientId':'925035513978-tv6qkm62kb4irdpjso6lprot1br1m5ut.apps.googleusercontent.com'
        }).then(success=>{
          console.log('resp',success);

          let provider = firebase.auth.GoogleAuthProvider.credential(success.idToken);
          this.setUserData(provider,success.idToken,'google').subscribe(success=>{
            observer.next(success);
          });          
        
        }).catch(error=>{
          console.log('error',error);
          observer.error(error);
        });
      } else {
          let provider = new firebase.auth.GoogleAuthProvider();
          firebase.auth().signInWithPopup(provider).then(resp=>{
            console.log('google keys',resp);
            let providerGoogle = firebase.auth.GoogleAuthProvider.credential(resp.credential.idToken);
            this.setUserData(providerGoogle,resp.credential.idToken,'google').subscribe(success=>{
              observer.next(success);
            });
          }).catch(error=>{
            console.log('error google login',error);
            observer.error(error);
          });        
      }
    });    
  }

  public isLoggedInFacebook() {
    return Observable.create(observer => {
      Facebook.getLoginStatus().then(resp=>{
        console.log('getFacebookDetail',resp);
        if (resp.status === 'connected') {
          /*
          Facebook.api('/'+resp.authResponse.userID + '?fields=id,name,gender',[]).then(success=>{
            console.log('fbResp',success);
          }).catch(error=>{
            console.log('error facebookDetail',error);
          });
          */
          console.log('logged off facebook');
          this.logoutFacebook().subscribe(loggedOut=>{
            observer.next(true);
          });
        } else {
          alert('Not logged in');
          observer.next(true);
        }
      }).catch(error=>{
        observer.error(error);
      });
    });
  }

  public logoutFacebook() {
    return Observable.create(observer => {
      Facebook.logout().then(resp=>{
        observer.next(true);
      }).catch(error=>{
        observer.error(error);
      });
    });
  }

  public loginFacebook() {

    return Observable.create(observer => {

      if (this.platform.is('cordova')) {
        
        Facebook.login(['email']).then(facebookData => {
          console.log('facebookData',facebookData);

          let provider = firebase.auth.FacebookAuthProvider.credential(facebookData.authResponse.accessToken);
          this.setUserData(provider,facebookData.authResponse.accessToken,'facebook').subscribe(success=>{
            observer.next(success);
          },error=>{
            console.log('error setUserData Facebook',error);
            observer.error(error);
          });          
        }).catch( error => {
          console.log('error facebookPlugin',error);
          observer.error(error);
        });

      } else {
        let provider = new firebase.auth.FacebookAuthProvider();
        provider.addScope('user_birthday');
        firebase.auth().signInWithPopup(provider).then(resp=>{
          console.log('facebook popup resp',resp);
          let providerFB = firebase.auth.FacebookAuthProvider.credential(resp.credential.accessToken);
          this.setUserData(providerFB,resp.credential.accessToken,'facebook').subscribe(success=>{
            observer.next(success);
          });
        }).catch(error=>{
            //console.log('error facebook login',error['code']);
            observer.error(error);
        });      
      }
    });
  }

  public setUserData(providerData,token,provider) {
    return Observable.create(observer => {
      firebase.auth().signInWithCredential(providerData).then(firebaseData => {            
        console.log('fbresp',firebaseData);
        this.storage.set('uid',firebaseData.uid);

        this.userExistsRef.ref('users/').once('value',snapshot=>{
          if (snapshot.hasChild(firebaseData.uid)) {
            this.updateUserData(firebaseData,provider,token);
            observer.next(firebaseData);
          } else {
            this.auth.currentUser.sendEmailVerification();
            this.writeUserData(firebaseData,provider,token);
            observer.next(firebaseData);                            
          }
        });
      }).catch(error=>{
        observer.error(error);
      });
    });
  }
 
  public register(credentials) {
    if (credentials.email === null || credentials.password === null) {
      return Observable.throw("Please insert credentials");
    } else {
      // At this point store the credentials to your backend!
      return Observable.create(observer => {
        observer.next(true);
        observer.complete();
      });
    }
  }
 
  public getUserInfo() : User {
    return this.currentUser;
  }

  public isLoggedIn() {
    return new Promise((resolve) => {

      this.storage.ready().then(()=>{

        this.storage.get("uid").then((status) =>{
            
            if (status == null ) {
              resolve(false);
            } else {
              this.sing.loggedIn = true;
              resolve(status);
            }
        });

      });        
       //this.sing.loggedIn;
    });
  }
 
  public logOut() {
    var that = this;
    return new Promise(resolve=>{
      firebase.auth().signOut().then(resp=>{
          that.storage.remove('uid');
          //console.log('logged out');
          resolve(true);
        }).catch(error=>{
          resolve(false);
          console.log('logout error',error);          
        });
    });
  }

}