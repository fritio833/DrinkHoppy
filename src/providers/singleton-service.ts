// App Global Variables

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import { Geolocation } from 'ionic-native';
import { Diagnostic } from '@ionic-native/diagnostic';
import { ToastController, AlertController, Events } from 'ionic-angular';

import firebase from 'firebase';

import { GoogleService } from './google-service';

@Injectable()
export class SingletonService {

  // User information set @ app.component.ts
  public loggedIn:boolean = false;
  public userName:string = '';
  public profileIMG:string = '';
  public realName:string = '';
  public token:string = '';
  public description:string = '';
  public environment = 'production';  // set to dev or production
  public geoCity = null;
  public geoState = null;
  public geoCountry = null;
  public geoLat = null;
  public geoLng = null;
  public isAdmin = true;

  public selectCity = null;
  public selectState = null;
  public selectCountry = null;
  public selectLat = null;
  public selectLng = null;
  public checkinsPerPage:number = 10;
  public checkBeerArray = new Array();
  public online:boolean = false;
  public checkinProximityMeters = 200;
  
  public popularLoaded:boolean = false;
  public webURL:string = 'http://brewsearchapp.com';
  public logo:string = 'https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/img%2Fbeerfest.png?alt=media&token=971dfd29-50c8-46b2-978c-4c406891b947';
  public noImageBeer:string = 'https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/img%2Fno-image.jpg?alt=media&token=5a8ee978-0ab9-4e8c-af54-dfedbd4be527';

  // App configuration.  API keys, webservice url, etc. 
  public breweryDbAPIKey:string = '3c7ec73417afb44ae7a4450482f99d70';
  public databaseServiceUrl:string = 'bender/';
  public beermappingAPIKey:string = '345ed2357f37f2d46eb2f1cfdc4b3646';
  public googleGeocodeAPIKey:string = 'AIzaSyA4dIwMeqXekFajK1uIesJn53LzkyZ_kU4';
  public googlePlacesAPIKey: string = 'AIzaSyDJ5qz7QX1yXkX2c444v5v0ziSPg15PLjM';
  public googleStaticMapAPIKey: string = 'AIzaSyCDIPt-NJwC23kzmYJ5ZTYTMd9brpBVbCk';

  //Testing. Dev Flags to simulate geolocation
  public test = false;
  public lat = 0;
  public lng = 0;

  //ABC Liquore Store 1930 Thomasville Rd, Tallahassee FL
  //public lat = 30.466237;
  //public lng = -84.269281;

  // Fermintation Lounge
  //public lat = 30.433812;
  //public lng = -84.286296;

  //McGuire's Pensacola
  //public lat = 30.418049;
  //public lng = -87.202452;

  //Pug Mahone's
  //public lat = 30.464098;
  //public lng = -84.298513;

  // Prime Time lounge
  //public lat = 30.448629;
  //public lng = -84.315217;

  // Test Leon Pub
  //public lat = 30.456357299999997;
  //public lng = -84.2797257;


  constructor(public toastCtrl:ToastController,
              public event:Events,
              public alertCtrl:AlertController,
              public diagnostic: Diagnostic) {}

  setOnlineListener() {
    var that = this;
    var fbRef = firebase.database().ref('.info/connected').on('value', function(connectedSnap) {
      if (connectedSnap.val() === true) {
        /* we're connected! */
        console.log('firebase connected');
        that.event.publish('online:status',true);
        that.online = true;
      } else {
        /* we're disconnected! */
        console.log('firebase disconnected');
        that.event.publish('online:status',false);
        that.online = false;
      }
    });
  }


  getLocation() {
    let loc:any;    
    if (this.selectCity != null && this.selectState != null) {
      loc = {city:this.selectCity,
             state:this.selectState,
             country:this.selectCountry,
             lat:this.selectLat,
             lng:this.selectLng,
             geo:false};
    } else if (this.geoCity != null && this.geoState != null) {
      loc = {city:this.geoCity,
             state:this.geoState,
             country:this.geoCountry,
             lat:this.geoLat,
             lng:this.geoLng,
             geo:true};
    } else {
      loc = null;
    }
    return loc;
  }

  getLocationKey() {
    let locObj = this.getLocation();
    
    if (locObj == null)
      return null;

    let key = locObj.city.toLowerCase().replace(/\s|\#|\[|\]|\$|\./g, "")
              +'-'+locObj.state.toLowerCase().replace(/\s|\#|\[|\]|\$|\./g, "")
              +'-'+locObj.country.toLowerCase().replace(/\s|\#|\[|\]|\$|\./g, "");
    return key;
  }

  getSelectCity() {
    if (this.selectCity != null) {
      return this.selectCity;
    } else {
      return this.geoCity;
    }
  }

  getSelectState() {
    if (this.selectState != null) {
      return this.selectState;
    } else {
      return this.geoState;
    }
  }

  getSelectCountry() {
    if (this.selectCountry != null) {
      return this.selectCountry;
    } else {
      return this.geoCountry;
    }
  }

  hasLocation() {
    if (this.selectCity!=null || this.geoCity!=null)
      return true;
    else
      return false;
  }

  isSelectedLocation() {
    if (this.selectCity!=null)
      return true;
    else
      return false;
  }

  setCurrentLocation(geo) {
    this.selectCity = geo.city;
    this.selectState = geo.state;
    this.selectCountry = geo.country;
    this.selectLat = geo.lat;
    this.selectLng = geo.lng;
  }

  setLocationToGeo() {
    this.selectCity = null;
    this.selectState = null;
    this.selectCountry = null;
    this.selectLat = null;
    this.selectLng = null;    
  }

  getCityStateKey(city,state,country) {
    // Remove special characters that would cause firebase to crash
    return city.toLowerCase().replace(/\s|\#|\[|\]|\$|\./g, "")
                        +'-'+state.toLowerCase().replace(/\s|\#|\[|\]|\$|\./g, "")
                        +'-'+country.toLowerCase().replace(/\s|\#|\[|\]|\$|\./g, "");
  }

  presentOffline() {
    let toast = this.toastCtrl.create({
      message: 'Could not connect. Check connection.',
      position: 'top',
      duration: 3000
    });
    toast.present();
  }  

  timeDifference(current, previous, short?) {

    if (previous == null)
      return '';

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;
    var checkOne;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
         if (this.environment == 'dev')
           return 'Today';

        if (short)
          return Math.round(elapsed/1000) + 's';
        else {
         checkOne = Math.round(elapsed/1000);
         if (checkOne == 1)
           return Math.round(elapsed/1000) + ' second ago';
         else
           return Math.round(elapsed/1000) + ' seconds ago';
        }  
    }

    else if (elapsed < msPerHour) {
         if (this.environment == 'dev')
           return 'Today';

         if (short)
           return Math.round(elapsed/msPerMinute) + 'm';
         else {
          checkOne = Math.round(elapsed/msPerMinute) ;
          if (checkOne == 1)
            return Math.round(elapsed/msPerMinute)  + ' minute ago';
          else
            return Math.round(elapsed/msPerMinute) + ' minutes ago';           
         }              
    }

    else if (elapsed < msPerDay ) {
         if (this.environment == 'dev')
           return 'Today';

         if (short)
           return Math.round(elapsed/msPerHour ) + 'h';
        else {
          checkOne = Math.round(elapsed/msPerHour) ;
          if (checkOne == 1)
            return Math.round(elapsed/msPerHour )  + ' hour ago';
          else
            return Math.round(elapsed/msPerHour ) + ' hours ago';            
        }
              
    }

    else if (elapsed < msPerMonth) {
        if (short)
          return Math.round(elapsed/msPerDay) + 'd';
        else {
          checkOne = Math.round(elapsed/msPerDay) ;
          if (checkOne == 1)
            return Math.round(elapsed/msPerDay)  + ' day ago';
          else
            return 'approximately ' + Math.round(elapsed/msPerDay) + ' days ago';
        } 
    }

    else if (elapsed < msPerYear) {
        if (short)
          return Math.round(elapsed/msPerMonth) + 'mo';
        else {
          checkOne = Math.round(elapsed/msPerMonth) ;
          if (checkOne == 1)
            return Math.round(elapsed/msPerMonth)  + ' month ago';
          else
            return 'approximately ' + Math.round(elapsed/msPerMonth) + ' months ago';           
        }
            
    }

    else {
        if (short)
          return Math.round(elapsed/msPerYear ) + 'yr';
        else {
          checkOne = Math.round(elapsed/msPerYear) ;
          if (checkOne == 1)
            return Math.round(elapsed/msPerYear)  + ' year ago';
          else
            return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years ago';           
        }
            
    }
  }

  getDateMonthDayYear(timestamp) {
    var a = new Date(timestamp);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();

    return month + ' ' + date + ', ' + year;
  }

  getMonthYearKey(timestamp) {
    var a = new Date(timestamp);
    var year = a.getFullYear();
    var month = a.getMonth()+1;

    return month + '-' + year;    
  } 

  getFormattedTime (fourDigitTime) {
      var hours24 = parseInt(fourDigitTime.substring(0, 2),10);
      var hours = ((hours24 + 11) % 12) + 1;
      var amPm = hours24 > 11 ? 'PM' : 'AM';
      var minutes = fourDigitTime.substring(2);

      return hours + ':' + minutes + amPm;
  }

  getServerTime() {
    return new Observable(observer=>{
      var offsetRef = firebase.database().ref(".info/serverTimeOffset");
      offsetRef.on("value", function(snap) {
        var offset = snap.val();
        var timestamp = new Date().getTime() + offset;
        observer.next(timestamp);
      },error=>{
        observer.error(error);
      });
    });  
  }

  getPriorityTime() {
    return new Observable(observer=>{

      var offsetRef = firebase.database().ref(".info/serverTimeOffset");
      offsetRef.on("value", function(snap) {
        var offset = snap.val();
        var negativeTimestamp = (new Date().getTime() + offset) * -1; // for ordering new checkins first
        observer.next(negativeTimestamp);
      },error=>{
        observer.error(error);
      });

    });
   
  }  

  getGeolocation() {
    let options = {timeout: 5000, enableHighAccuracy: true, maximumAge:3000};

    return Observable.fromPromise(Geolocation.getCurrentPosition(options))
      .map(location => location.coords)
      .map(coords => {
        if (coords.latitude){
          console.log('geo high accuracy');
          return coords;
        } else  
          throw Observable.throw('Geolocation High Accuracy Timeout');
      })
      .retryWhen(error => error.delay(1000))
      .timeout(5000);
  }

  getGeolocationLow() {
    let options = {timeout: 30000, enableHighAccuracy: false, maximumAge:3000};

    return Observable.fromPromise(Geolocation.getCurrentPosition(options))
      .map(location => location.coords)
      .map(coords => {
        if (coords.latitude){
          console.log('geo low accuracy');
          return coords;
        } else  
          throw Observable.throw('Geolocation Low Accuracy Timeout');
      })
      .retryWhen(error => error.delay(1000))
      .timeout(10000);
  }

  getUserLocation() {
    return new Observable(observer=>{
      // Get geolocation.  Sets our app.
      this.getGeolocation().subscribe(resp=>{
        observer.next(resp);
      },error=>{
        console.log('error',error);
        // Attempt to get geo with low accuracy
        this.getGeolocationLow().subscribe(lowResp=>{
          observer.next(lowResp);
        },error=>{
          //console.log('error',error);
          observer.error(error);
        });
      }); 

    });
  }  

  setCheckinTime(time,beerId) {
    let found:boolean = false;
    let dateTime:number = new Date().getTime();
    var elapsed = dateTime - time;
    let timeDifference = Math.round(elapsed/1000);
    let indexToRemove:number = 0;

    for (var i=0; i<this.checkBeerArray.length; i++) {

      if (this.checkBeerArray[i].beerId == beerId) {

        found = true;

        if (timeDifference > 30)
          indexToRemove = i;
        else
          this.checkBeerArray[i].checkinTime = dateTime;

      }
    }

    if (!found) {
      this.checkBeerArray.push({beerId:beerId,checkinTime:dateTime});
    }
    if (indexToRemove) {
      this.checkBeerArray.slice(indexToRemove);
    }

    console.log('set',this.checkBeerArray);
  }


  canCheckIn(beerId) {
    let indexToRemove:number = 0;
    let dateTime:number = new Date().getTime();
    var elapsed:number;
    let timeDifference:number;
    let prevTime:number;

    if (!this.checkBeerArray.length)
      return true;

    for (var i=0; i < this.checkBeerArray.length; i++) {

      if (this.checkBeerArray[i].beerId == beerId) {
        prevTime = this.checkBeerArray[i].checkinTime;
        elapsed = dateTime - prevTime;
        timeDifference = Math.round(elapsed/1000);
        console.log('timeDiff',timeDifference);
        if (timeDifference > 30)
          indexToRemove = i;
        else {
          console.log('check1',this.checkBeerArray);
          return false;
        }        
      }
    }
    
    this.checkBeerArray.slice(indexToRemove);
    return true;
  }

  showSettings(){
    if (this.diagnostic.switchToWifiSettings) {
      this.diagnostic.switchToWifiSettings();
    } else {
      this.diagnostic.switchToSettings();
    }    
  }  

 showNetworkAlert() {
    let networkAlert = this.alertCtrl.create({
      title: 'No Internet Connection',
      message: 'Please check your internet connection.',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {}
        },
        {
          text: 'Open Settings',
          handler: () => {
            networkAlert.dismiss().then(() => {
              this.showSettings();
            })
          }
        }
      ]
    });
    networkAlert.present();
  }

  canUserCheckin(userRole,locationLat,locationLng) {
    return new Observable(observer=>{

      // Admins are not restricted by distance and can checkin at any location
      if (userRole === 'admin') {
        observer.next({checkin:true,msg:null});
        observer.complete();
      } else {

        let locGeo =  {lat:locationLat,lng:locationLng};

        this.getUserLocation().subscribe(resp=>{
          //console.log('geoHigh',resp['latitude']);
          let userGeo = {};
          
          if (this.test)
            userGeo = {lat:this.lat,lng:this.lng};
          else
            userGeo = {lat:resp['latitude'],lng:resp['longitude']};

          let distanceFromLocation = this.getDistanceMeters(locGeo,userGeo);

          if (distanceFromLocation > this.checkinProximityMeters) {
            let distToCheckin = this.convertMetersToMiles(distanceFromLocation - this.checkinProximityMeters);
            //this.presentToast('You are too far away to checkin by ' + distToCheckin + ' miles');
            observer.next({checkin:false,msg:'You are too far away to checkin by ' + distToCheckin + ' miles'});
            observer.complete();
          } else {
            observer.next({checkin:true,msg:null});
            observer.complete();
          }
          
          },error=>{
            console.log('error',error);
            // Attempt to get geo with low accuracy
            //this.presentToast('Unable to get your location. Try checking in again.');
            observer.error('Unable to get your location. Try checking in again.');
        }); 
      }
    });
  }

  rad(x) {
    return x * Math.PI / 180;
  };

  convertMetersToMiles(meters) {
    let dist = meters * 0.00062137; 
    return dist.toFixed(2);
  }

  getDistanceMeters(p1,p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = this.rad(p2.lat - p1.lat);
    var dLong = this.rad(p2.lng - p1.lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.rad(p1.lat)) * Math.cos(this.rad(p2.lat)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;    
  }   

}