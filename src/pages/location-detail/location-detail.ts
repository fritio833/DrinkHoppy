import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, LoadingController, ModalController, ToastController, Platform } from 'ionic-angular';
import { Geolocation } from 'ionic-native';
import { Ionic2RatingModule } from 'ionic2-rating';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';

import { LocationService } from '../../providers/location-service';
import { GoogleService } from '../../providers/google-service';
import { BreweryService } from '../../providers/brewery-service';
import { SingletonService } from '../../providers/singleton-service';
import { SocialService } from '../../providers/social-service';
import { AuthService } from '../../providers/auth-service';
import { ConnectivityService } from '../../providers/connectivity-service';

import { LocationMapPage } from '../location-map/location-map';
import { LocationDetailsMorePage } from '../location-details-more/location-details-more';
import { CheckinPage } from '../checkin/checkin';
import { DrinkMenuPage } from '../drink-menu/drink-menu';
import { ReviewsPage } from '../reviews/reviews';

import { BeerDetailPage } from '../beer-detail/beer-detail';

import firebase from 'firebase';

declare var window;

@Component({
  selector: 'page-location-detail',
  templateUrl: 'location-detail.html'
})
export class LocationDetailPage {

  @ViewChild('map') mapElement;
  public placeId:any;
  public locScore:any;
  public locImages:any;
  public locMap:any;
  public location:any;
  public locationRating:any;
  public locationHours:any;
  public locationOpen:any;
  public locationPhoto:any;
  public locationLat:any;
  public locationLng:any;
  public locationReviews:any;
  public loading:any;
  public checkins:any;
  public checkinLen:number;
  public breweryBeers = new Array();
  public locationPhotosArray = new Array();
  public showPhotos:boolean = false;
  public checkinsPerPage:number;
  public limit:any;
  public lastKey:string;
  public queryable:boolean = true;
  public localBeers:FirebaseListObservable<any>;
  public localBeerLen:number;
  public fbRef:any;
  public uid:any;



  constructor(public navCtrl:NavController, 
  	          public params:NavParams,
              public loadingCtrl:LoadingController,
  	          public loc:LocationService,
              public modalCtrl:ModalController,
              public beerAPI:BreweryService,
              public sing:SingletonService,
              public platform:Platform,
              public angFire:AngularFire,
              public cdr:ChangeDetectorRef,
              public storage:Storage,
              public social:SocialService,
              public toastCtrl:ToastController,
              public auth:AuthService,
              public conn:ConnectivityService,
  	          public geo:GoogleService) {

    

    this.location = params.get("location");
    this.checkinsPerPage = this.sing.checkinsPerPage;
    this.limit = new BehaviorSubject(this.checkinsPerPage);
    this.fbRef = firebase.database();


    this.storage.ready().then(()=>{
      this.storage.get('uid').then(uid=>{
        this.uid = uid;  
      });
    });     
    
  }

  showLoading(msg) {
    this.loading = this.loadingCtrl.create({
      content: msg
    });
    this.loading.present();
  }

  getCheckIns() {
    this.checkins =  this.angFire.database.list('/checkin/locations/'+this.location.place_id,{
      query:{
        orderByChild:'priority',
        limitToFirst: this.limit
      }
    });
  
    this.angFire.database.list('/checkin/locations/'+this.location.place_id,{
      query: {
        orderByChild: 'priority',
        limitToLast: 1
      }
    }).subscribe((data) => {
      // Found the last key
      if (data.length > 0) {
        this.lastKey = data[0].$key;
      } else {
        this.lastKey = '';
      }
    });
  
    this.checkins.subscribe(resp=>{
      this.checkinLen = resp.length;
      //console.log('resp',resp);
      if (resp.length > 0) {
        // If the last key in the list equals the last key in the database
        if (resp[resp.length - 1].$key === this.lastKey) {
          this.queryable = false;
        } else {
          this.queryable = true;
        }
      }      
    });
  }

  viewMap() {
    let modal = this.modalCtrl.create(LocationMapPage,
                                      { lat:this.locationLat,
                                        lng:this.locationLng,
                                        locName:this.location.name
                                      });
    modal.present();
  }



  viewReviews() {
    let modal = this.modalCtrl.create(ReviewsPage,
                                      { 
                                        reviews:this.locationReviews,
                                        locName:this.location.name
                                      });
    modal.present();
  }  

  getBackgroundImg(pic) {
    let img:any;
    img = {backgroundImage:''};
    if(pic == null || pic == '')
      return;
    else {
      img.backgroundImage = 'url('+pic+')';
      return img;
    }
  }

  fixBreweryBeers() {

    for (var i = 0; i < this.breweryBeers.length; i++) {
      if (!this.breweryBeers[i].hasOwnProperty('labels')) {
        this.breweryBeers[i]['labels'] = {icon:'images/no-image.jpg',medium:'images/no-image.jpg'};
      }
      if (!this.breweryBeers[i].hasOwnProperty('style')) {
        this.breweryBeers[i]['style'] = {shortName:''};  
      }
    }
  }

  viewMore() {
     this.navCtrl.push(LocationDetailsMorePage,{location:this.location,
                                                photo:this.locationPhoto}); 
  }

  showDrinkMenu() {
    this.navCtrl.push(DrinkMenuPage,{location:this.location});
  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }   

  isBrewery() {

    this.beerAPI.findBreweriesByGeo(this.locationLat,this.locationLng,1).subscribe((brewery)=>{

      if (brewery.hasOwnProperty('data')) {

        for (let i=0;i<brewery.data.length;i++) {

          let breweryAPIName = brewery.data[i].brewery.nameShortDisplay.toLowerCase();
          let locationName = this.location.name.toLowerCase();
 
          // brewery found.  Get beers.
          if (locationName.indexOf(breweryAPIName) !== -1) {
            //console.log('test:'+breweryAPIName+'|'+locationName,locationName.indexOf(breweryAPIName));
            this.beerAPI.loadBreweryBeers(brewery.data[i].brewery.id).subscribe((beers)=>{
              
              if (beers.hasOwnProperty('data')) {
                this.breweryBeers = beers.data;
                this.fixBreweryBeers();
              }
              //console.log(beers);
            });
          }
        }
        //console.log('brewery',brewery);
      }
    });
  }

  fixPlaceType(placeType) {
    let pType = '';
    switch(placeType) {
      case 'bar': pType = 'Bar'; break;
      case 'convenience_store': pType = 'Convenience Store'; break;
      case 'night_club': pType = 'Night Clubs'; break;
      case 'grocery_or_supermarket': pType = 'Grocery Store'; break;
      case 'liquor_store': pType = 'Liquor Store'; break;
      case 'restaurant': pType = 'Restaurant'; break;
      case 'gas_station': pType = 'Gas Station'; break;
      default: pType = placeType;
    }
    return pType;
  }

  callIt(phoneNo) {
    phoneNo = encodeURIComponent(phoneNo);
    window.location = "tel:"+phoneNo;
  }

  checkIn() {
    
    if (this.sing.isOnline()) {

      this.sing.canUserCheckin(this.auth.userRole,this.locationLat,this.locationLng).subscribe(canCheckIn=>{

        console.log('here',canCheckIn);
        
        if (canCheckIn['checkin']) {
          let modal = this.modalCtrl.create(CheckinPage,{ location:this.location,checkinType:'place'});
          modal.present();
        } else {
          this.presentToast(canCheckIn['msg']);
        }
      },error=>{
        console.log('error canUserCheckin',error);
        this.presentToast(error);
      });
    } else
      this.sing.showNetworkAlert();

  }

  getGoogleStaticMap() {
    return this.geo.getStaticMap(this.locationLat,this.locationLng);
  }

  goToNavApp() {
      let destination = this.locationLat + ',' + this.locationLng;

      if(this.platform.is('ios')){
        window.open('maps://?q=' + destination, '_system');
      } else {
        let label = encodeURIComponent(this.location.name);
        window.open('geo:0,0?q=' + destination + '(' + label + ')', '_system');
      }    
  }

  showAllPhotos() {

   this.showLoading('Loading Pictures');
   this.getPlacePhotos().then(success=>{
      this.showPhotos = true;
      this.loading.dismiss();
   }).catch(error=>{
     console.log('error ShowAllPhotos',error);
     this.loading.dismiss().catch(()=>{});
   });

  }

  save() {
    let locPhoto='';
    if (this.locationPhoto != null) {
      locPhoto = this.locationPhoto.replace(/s\d+\-w\d+/g, "s100-w100");
    }
    
    this.fbRef.ref('/favorite_locations/'+this.uid+'/'+this.location.place_id).set({
      photo:locPhoto,
      name:this.location.name,
      placeType:this.location.place_types,
      vicinity:this.location.vicinity,
      isBrewery:'N',
      lat:this.location.geometry.location.lat,
      lng:this.location.geometry.location.lng
    }).then(resp=>{
      this.presentToast(this.location.name+' saved to favorites');
    });
  }

  getPlacePhotos() {
    return new Promise(resolve => {

      for (let i = 1; i < this.locationPhotosArray.length; i++) {

        this.geo.placePhotos(this.locationPhotosArray[i].photo_reference).subscribe((photo)=>{
            this.locationPhotosArray[i]['url'] = photo.url;
            if (i == (this.locationPhotosArray.length-1))
              resolve(true);
        },error=>{
          console.log('error',error);
        });
      }
    });
  }

  getTimestamp(prevTime) {
    return this.sing.timeDifference(new Date().getTime(),prevTime,true);
  }

 getMoreCheckins(infiniteScroll) {
   //console.log('inf',infiniteScroll);
    setTimeout(() => {
      if (this.queryable)
        this.limit.next(this.limit.getValue()+this.checkinsPerPage);

      infiniteScroll.complete();

      if (!this.queryable)
        infiniteScroll.enable(false);
    }, 1000);
  }

  getBeerDetail(beerId) {
  	this.navCtrl.push(BeerDetailPage,{beerId:beerId});

  }

  shareFacebook() {
    this.social.shareFacebook(this.location.name,
        this.location.vicinity,
        this.locationPhoto,
        'place',
        this.location.place_id
        ).subscribe(success=>{
          //alert('shared success');
          console.log('success',success);
        },error=>{
          //alert('failed');
          console.log('error shareFacebook',error);
        });
  }  

  getBeerMenu() {
    if (this.location) {
      this.localBeers = this.angFire.database.list('/location_menu/'+this.location.place_id+'/beers',{
        query: {
          orderByChild: 'priority',
          limitToFirst: 10
        }
      });

      this.fbRef.ref('/location_menu/'+this.location.place_id+'/beers').once('value',snapshot=>{
        console.log(snapshot.val());
        this.localBeerLen = snapshot.numChildren();
      });
    }    
  }

  getCheckinTime(prevTime) {
      return this.sing.timeDifference( new Date().getTime(),prevTime,true);
  }
  
  ngOnInit() {
    this.cdr.detach();
  }

  ngAfterViewInit() {
    setTimeout(() => this.cdr.reattach());
    console.log('ionViewDidLoad LocationDetailPage');

    this.getBeerMenu();

    this.getCheckIns();

    this.locationRating = this.location.rating;

    // get picture
    if (this.location.hasOwnProperty('photos')) {
      this.geo.placePhotos(this.location.photos[0].photo_reference).subscribe((photo)=>{
        this.locationPhoto = photo.url;
      },error=>{
        console.log('error',error);
      });
    } else {
      // this.locationPhoto = '../images/bar3.jpg';
      this.locationPhoto = null;
    }

    if (this.location.hasOwnProperty('opening_hours')) {
      console.log(this.location.opening_hours);
      //this.locationHours = this.location.opening_hours.weekday_text;
      let dayOfWeek;

      dayOfWeek = this.location.opening_hours.weekday_text[new Date().getDay()];
        /*
        this.locationHours = this.sing.getFormattedTime(dayOfWeek.open.time) 
                            + ' - ' + this.sing.getFormattedTime(dayOfWeek.close.time);
        */
      this.locationHours = dayOfWeek;
    
      this.locationOpen = this.location.opening_hours.open_now;
         
    }
    else {
      this.locationHours = null;
      this.locationOpen = null;
    }

    console.log('locHours',this.locationHours);

    // get lat, lng
    if (this.location.hasOwnProperty('geometry')) {
      this.locationLat = this.location.geometry.location.lat;
      this.locationLng = this.location.geometry.location.lng;
    }

    // get reviews
    if (this.location.hasOwnProperty('reviews')) {
      this.locationReviews = this.location.reviews;
    }

    // get photo array
    if (this.location.hasOwnProperty('photos')) {
      this.locationPhotosArray = this.location.photos;
    }     

    let ptypes ='';
    
    for (var i = 0; i < this.location.types.length; i++) {
        
        if (this.location.types[i] == 'bar'
            || this.location.types[i] == 'night_club'
            || this.location.types[i] == 'convenience_store'
            || this.location.types[i] == 'liquor_store'
            || this.location.types[i] == 'gas_station'
            || this.location.types[i] == 'grocery_or_supermarket') {
          ptypes += this.fixPlaceType(this.location.types[i]) +', ';
        }
    }

    this.location.place_types = ptypes.replace(/,\s*$/, "").replace(/_/g, " ");

    if (this.params.get('loading')!=null) {
      this.params.get('loading').dismiss();
    }
    
  }

  

}
