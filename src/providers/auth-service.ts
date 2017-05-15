import { Injectable } from '@angular/core';
import { Platform, App, Events } from 'ionic-angular';

import { Observable } from 'rxjs/Observable';
import { AuthProviders, AuthMethods, AngularFire  } from 'angularfire2';
import { Facebook, Geolocation } from 'ionic-native';
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

  public updateUserData(resp) {
    let timestamp = firebase.database.ServerValue.TIMESTAMP;
    let updateData = {dateLoggedIn:timestamp};

    this.userRef.ref('users/' + resp.uid).update(updateData);    
  }

  public writeUserData(resp,provider,fbTok?,credName?) {
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

    this.userRef.ref('users/' + resp.uid).set({
      uid:resp.uid,
      name:displayName,
      nameLower:displayName.toLowerCase(),
      email:resp.email,
      dateCreated:timestamp,
      dateLoggedIn:timestamp,      
      facebookToken:fbTok,
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
    });
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

  
  /*
  public signupEmail(cred) {
    return new Promise( resolve => {
      
      this.angFire.auth.createUser({email:cred.email.value,password:cred.pword.value}).then(newUser=>{
        let timestamp = firebase.database.ServerValue.TIMESTAMP;
        console.log('newUser created',newUser);
        // TODO: send sendPasswordResetEmail
        this.auth.currentUser.sendEmailVerification();
        //this.writeUserData(newUser.uid,cred.name.value,cred.email.value,)

        this.userRef.ref('users/' + newUser.uid).set({
          uid: newUser.uid,
          username: cred.userName.value,
          displayName: cred.name.value,
          DOB: cred.birthDay.value, 
          email: newUser.auth.email,
          profilePicture: newUser.auth.photoURL,
          dateCreated: timestamp,
          checkins: 0,
          emailVerified: newUser.auth.emailVerified
        });

        resolve(newUser);
      }).catch(error=>{
        console.log('error',error);
        resolve(error);
      });

    });
  }
  */
  public loginFacebook() {

    return Observable.create(observer => {

      if (this.platform.is('cordova')) {
        Facebook.login(['public_profile','email']).then(facebookData => {
          //console.log('facebookData',facebookData);

          let provider = firebase.auth.FacebookAuthProvider.credential(facebookData.authResponse.accessToken);
          firebase.auth().signInWithCredential(provider).then(firebaseData => {
            //console.log('firebaseData',firebaseData);
            this.storage.set('uid',firebaseData.uid);

            this.userExistsRef.ref('users/').once('value',snapshot=>{
              if (snapshot.hasChild(firebaseData.uid)) {
                this.updateUserData(firebaseData);
                observer.next(firebaseData);
              } else {
                this.auth.currentUser.sendEmailVerification();
                this.writeUserData(firebaseData,'facebook',facebookData.authResponse.accessToken);
                observer.next(firebaseData);                            
              }
            });
          });
        }, error => {
          observer.error(error);
        });
      } else {
          let provider = new firebase.auth.FacebookAuthProvider();
          provider.addScope('user_birthday');
          firebase.auth().signInWithPopup(provider).then(resp=>{

          let providerFB = firebase.auth.FacebookAuthProvider.credential(resp.credential.accessToken);
          firebase.auth().signInWithCredential(providerFB).then(firebaseData => {            
            //console.log('fbresp',firebaseData);
            this.storage.set('uid',firebaseData.uid);

            this.userExistsRef.ref('users/').once('value',snapshot=>{
              if (snapshot.hasChild(firebaseData.uid)) {
                this.updateUserData(firebaseData);
                observer.next(firebaseData);
              } else {
                this.auth.currentUser.sendEmailVerification();
                this.writeUserData(firebaseData,'facebook',resp.credential.accessToken);
                observer.next(firebaseData);                            
              }
            });
            
          });
          }).catch(error=>{
            console.log('error facebook login',error);
            observer.next(error);
          });        
      }

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
              resolve(true);
            }
        });

      });        
       //this.sing.loggedIn;
    });
  }

  public setSingletonData() {

    console.log("Setting Singleton Data");
    this.storage.ready().then(()=>{

      this.storage.get('fbPic').then((fbPic)=>{
        this.sing.profileIMG = fbPic;
      });

      this.storage.get("userName").then((uName) =>{
        if ( uName != null )
          this.sing.userName = uName;
      });
      this.storage.get("name").then((name) =>{
        if ( name != null)
            this.sing.realName = name;
      });

      this.storage.get("description").then((description) =>{
          this.sing.description = description;
      });

      this.storage.get("token").then((token) =>{
          this.sing.token = token;
      });                 

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