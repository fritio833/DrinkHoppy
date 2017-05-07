// App Global Variables

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import { Geolocation } from 'ionic-native';

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
  public environment = 'dev';
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
  
  public popularLoaded:boolean = false;

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
  //public lat = 30.464105;
  //public lng = -84.298067;


  constructor() {}

  getLocation() {
    let loc:any;    
    if (this.selectCity != null && this.selectState != null) {
      loc = {city:this.selectCity,
             state:this.selectState,
             country:this.selectCountry,
             lat:this.selectLat,
             lng:this.selectLng,
             geo:false};
    } else {
      loc = {city:this.geoCity,
             state:this.geoState,
             country:this.geoCountry,
             lat:this.geoLat,
             lng:this.geoLng,
             geo:true};
    }
    return loc;
  }

  getLocationKey() {
    let locObj = this.getLocation();
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
          indexToRemove = i; //this.checkBeerArray.slice()
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
}