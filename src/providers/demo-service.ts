import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

import { SingletonService } from './singleton-service';

import firebase from 'firebase';

@Injectable()
export class DemoService {

  public fbRef:any;

  constructor(public sing: SingletonService) {
    console.log('Hello DemoService Provider');
    this.fbRef = firebase.database();
  }

  setBeerDemo(data) {
    return new Observable(observer => {

      this.fbRef.ref('/beers/'+data.beerId).transaction(value=>{
        if (value) {          
          value.checkinCount++;
          //value.cities[]         
          return value;
        } else {
          let newBeer = {
            name:data.beerDisplayName,
            img:data.beerIMG,
            abv:data.beerABV,
            ibu:data.beerIBU,
            style:data.beerStyleShortName,
            brewery:data.breweryShortName,
            breweryIMG:data.breweryImages,
            breweryId:data.breweryId,
            beerLabelIcon:data.beerLabelIcon,
            beerLabelMedium:data.beerLabelMedium,
            beerLabelLarge:data.beerLabelLarge,           
            checkinCount:1,
          };
          return newBeer;
        }
      },(error,committed,snapshot)=>{

        if (error) {
           observer.error(error);
        } else if (committed) {
          let cityKey = data.city.toLowerCase().replace(/[^A-Z0-9]/ig, "")
                        +'-'+data.state.toLowerCase().replace(/[^A-Z0-9]/ig, "")
                        +'-'+data.country.toLowerCase();
          this.fbRef.ref('/beers/'+data.beerId+'/cities/'+cityKey).transaction(value=>{
            return (value||0)+1;
          });
        }
      });
      observer.next(true);
    });
  }

  setCheckinUserCount(uid) {
    return new Observable(observer => {
      this.fbRef.ref('/users/'+uid+'/checkins').transaction(value=>{
          //value.cities[]       
          return (value||0)+1;
      });
      observer.next(true);
    });    
  }

  setUserScore(uid,score,data) {
    return new Observable(observer => {
      this.fbRef.ref('/users/'+uid+'/points').transaction(value=>{    
          return (value||0)-score;
      },(error,committed,snapshot)=>{
        if (error) {
          observer.error(error);
        } else if (committed) {
          let timestamp = new Date().getTime();
          let dateKey = this.sing.getMonthYearKey(timestamp);
          console.log('hello',dateKey);
          this.fbRef.ref('/leaderboard/'+dateKey+'/'+uid).transaction(value=>{
            if (value) {
              value.points-=score;
              return value;
            } else { 
              let user = {
                uid:data.uid,
                photo:data.userIMG,
                name:data.userName,
                points:score * -1
              }
              return user;
            }
          });
        }
      });
      observer.next(true);
    });
  }

  setLocation(data) {
    return new Observable(observer => {
      this.fbRef.ref('/locations/'+data.placeId).transaction(value=>{
        if (value) {
          value.photo = data.photo;
          value.checkinCount++;
          return value;
        } else {
          let locData = {
            placeId:data.placeId,
            breweryId:data.breweryId,
            name:data.name,
            photo:data.photo,
            placeType:data.placeType,
            lat:data.lat,
            lng:data.lng,
            address:data.address,
            city:data.city,
            state:data.state,
            zip:data.zip,
            country:data.country,
            checkinCount:1
          }
          return locData;          
        }
      },(error,committed,snapshot)=>{
        if (error)
          observer.error(error);

        if(committed)
          observer.next(true);
      });
    });    
  }
  setBeerByLocation(data) {
    return new Observable(observer => {

      if (data.placeId!=null && data.placeId!='') {
        this.getUpdateTime().subscribe(priorityTime=>{
          this.fbRef.ref('/location_menu/'+ data.placeId +'/beers/'+data.beerId).transaction(value=>{
            if (value) {          
              value.beerUpdated = firebase.database.ServerValue.TIMESTAMP;
              value.priority = priorityTime;
              value.checkinCount++;
              //value.priority = this.getUpdateTime();
              return value;
            } else {
              let newBeer = {
                uid:data.uid,
                name:data.beerDisplayName,
                img:data.beerIMG,
                abv:data.beerABV,
                ibu:data.beerIBU,
                breweryId:data.breweryId,
                beerLabelIcon:data.beerLabelIcon,
                beerLabelMedium:data.beerLabelMedium,
                beerLabelLarge:data.beerLabelLarge, 
                style:data.beerStyleShortName,
                brewery:data.breweryShortName,
                breweryIMG:data.breweryImages,
                beerUpdated:firebase.database.ServerValue.TIMESTAMP,
                beerCreated:firebase.database.ServerValue.TIMESTAMP,
                priority:priorityTime,
                checkinCount:1
              };
              return newBeer;
            }
          },(error,committed,snapshot)=>{
            if (error) {
              observer.error(error);
            } else if (committed) { 
              if (data.servingStyleName !=null && data.servingStyleName!=''){
                this.fbRef.ref('/location_menu/'+data.placeId+'/beers/'+data.beerId+'/servingStyle/'+data.servingStyleName)
                  .transaction(value=>{
                    if (value) {
                      value.uid = data.uid;
                      value.reported++;
                      value.timestamp = firebase.database.ServerValue.TIMESTAMP;
                      return value;
                    } else {
                      let newServStyle = {
                        uid:data.uid,
                        timestamp:firebase.database.ServerValue.TIMESTAMP,
                        reported: 1
                      }
                      return newServStyle;
                    }
                  },(error,committed,snapshot)=>{
                    if(error)
                      observer.error(error);
                    if(committed)
                      observer.next(true);
                  });
                }
             }
          });
        });
      }
    });
  }

  setLocationbyCityDemo(data) {
    console.log('i got here location city demo');
    return new Observable(observer => {
      let cityKey = data.city.toLowerCase().replace(/[^A-Z0-9]/ig, "")
                    +'-'+data.state.toLowerCase().replace(/[^A-Z0-9]/ig, "")
                    +'-'+data.country.toLowerCase();
      let beerCityRef = '';
      this.fbRef.ref('/location_by_city/'+cityKey+'/'+data.placeId).transaction(value=>{
        if (value) {          
          value.checkinCount--;
          value.timestamp = firebase.database.ServerValue.TIMESTAMP;
          value.photo = data.photo;    
          return value;
        } else {
            let location = {
              name:data.name,
              placeId:data.placeId,
              address:data.address,
              city:data.city,
              state:data.state,
              zip:data.zip,
              photo:data.photo,
              timestamp:firebase.database.ServerValue.TIMESTAMP,
              uid:data.uid,
              lat:data.lat,
              lng:data.lng,
              checkinCount:-1,
              isBrewery:data.isBrewery,
              placeType:data.placeType
            }
            return location;
        }
      },(error,committed,snapshot)=>{

        if (committed)
          observer.next(true);

        if (error)
          observer.error(error);
      });
      
    });
  }

  setBeerByCityDemo(data) {
    return new Observable(observer => {
      let cityKey = data.city.toLowerCase().replace(/[^A-Z0-9]/ig, "")
                    +'-'+data.state.toLowerCase().replace(/[^A-Z0-9]/ig, "")
                    +'-'+data.country.toLowerCase();
      let beerCityRef = '';
      this.fbRef.ref('/beer_by_city/'+cityKey+'/'+data.beerId).transaction(value=>{
        if (value) {          
          value.checkinCount--;
          //value.cities[]         
          return value;
        } else {
          let newBeer = {
            name:data.beerDisplayName,
            img:data.beerIMG,
            abv:data.beerABV,
            ibu:data.beerIBU,
            breweryId:data.breweryId,
            beerLabelIcon:data.beerLabelIcon,
            beerLabelMedium:data.beerLabelMedium,
            beerLabelLarge:data.beerLabelLarge,             
            style:data.beerStyleShortName,
            brewery:data.breweryShortName,
            breweryIMG:data.breweryImages,
            checkinCount:-1
          };
          return newBeer;
        }
      },(error,committed,snapshot)=>{
        if (error) {

          observer.error(error);

        } else if (committed) {  
          this.fbRef.ref('/beer_by_city/'+cityKey+'/'+data.beerId+'/locations/'+data.placeId).transaction(value=>{
            if (value) {
              value.checkinCount++;
              value.photo = data.photo;
              value.timestamp = firebase.database.ServerValue.TIMESTAMP;
              value.uid = data.uid;
              return value;
            } else {
              let location = {
                name:data.name,
                placeId:data.placeId,
                address:data.address,
                city:data.city,
                state:data.state,
                zip:data.zip,
                photo:data.photo,
                timestamp:firebase.database.ServerValue.TIMESTAMP,
                uid:data.uid,
                lat:data.lat,
                lng:data.lng,
                checkinCount:1,
                isBrewery:data.isBrewery,
                placeType:data.placeType
              }
              return location;
            }
          },(error,committed,snapshot)=>{
             if (error)
               observer.error(error);
            
             if (committed)
               observer.next(true);
          });
        }
      });
    });
  }

  getUpdateTime() {
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

}
