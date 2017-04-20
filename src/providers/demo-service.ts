import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

import firebase from 'firebase';

@Injectable()
export class DemoService {

  public fbRef:any;

  constructor(public http: Http) {
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
      },(complete)=>{
         let cityKey = data.city.toLowerCase()+'-'+data.state.toLowerCase()+'-'+data.country.toLowerCase();
         this.fbRef.ref('/beers/'+data.beerId+'/cities/'+cityKey).transaction(value=>{
          return (value||0)+1;
         });
      });
      observer.next(true);
    });
  }

  setCheckinUserCount(uid) {
    return new Observable(observer => {
      this.fbRef.ref('/users/'+uid+'/checkins').transaction(value=>{
          //value.cities[]       
          return (value||0)+1;
      },(complete)=>{

      });
      observer.next(true);
    });    
  }

  setUserScore(uid,score) {
    return new Observable(observer => {
      this.fbRef.ref('/users/'+uid+'/points').transaction(value=>{
          //value.cities[]       
          return (value||0)+score;
      },(complete)=>{

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
      },(complete)=>{

      });
      observer.next(true);
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
          },(complete)=>{

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
              });
            }
          });
        });

      }
      observer.next(true);
    });
  }

  setBeerByCityDemo(data) {
    return new Observable(observer => {
      let cityKey = data.city.toLowerCase()+'-'+data.state.toLowerCase()+'-'+data.country.toLowerCase();
      this.fbRef.ref('/beer_by_city/'+cityKey+'/'+data.beerId).transaction(value=>{
        if (value) {          
          (value.checkinCount||0)+1;
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
            checkinCount:1,
          };
          return newBeer;
        }
      },(complete)=>{


      });
      observer.next(true);
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
