import { Component, ViewChild } from '@angular/core';
import { NavController, Platform, ModalController, ActionSheetController } from 'ionic-angular';
import { Slides, NavParams, ViewController, LoadingController, AlertController, ToastController } from 'ionic-angular';

import { Geolocation, SocialSharing, Camera } from 'ionic-native';
import { Ionic2RatingModule } from 'ionic2-rating';

import { AngularFire, FirebaseListObservable } from 'angularfire2';
import firebase from 'firebase';

import { GoogleService } from '../../providers/google-service';
import { BreweryService } from '../../providers/brewery-service';
import { SingletonService } from '../../providers/singleton-service';
import { AuthService } from '../../providers/auth-service';
import { DemoService } from '../../providers/demo-service';
import { NotificationService } from '../../providers/notification-service';

import { CheckinSelectBeerPage } from '../checkin-select-beer/checkin-select-beer';
import { FriendsPage } from '../friends/friends';

declare var cordova: any;

@Component({
  selector: 'page-checkin',
  templateUrl: 'checkin.html'
})
export class CheckinPage {

  @ViewChild(Slides) slides: Slides;
  public beer:any;
  public locations:any;
  public location;
  public locationName;
  public locationsLen:number;
  public price:number;
  public socialMessage:string = "";
  public lat:number;
  public lng:number;
  public locChoice:number;
  public glassware:number;
  public servingStyleName:any;
  public loading:any;
  public checkinType:string;
  public promises:any;
  public base64Image:string;
  public imageToUpload:string;
  public beerRating:number = 0;
  public slideIndex:number = 0;
  public showLocationSlide:boolean = false;
  public showPurchaseSlide:boolean = false;
  public maxMsgLen:number = 150;
  public lastImage: string = null;
  public showPager:boolean = true; 
  public checkin:any;
  public checkinLocationRF:any;
  public checkinUserRF:any;
  public checkinBeerRF:any;
  public usersRef:any;
  public checkinBreweryRF:any;
  public checkinPictureRef: firebase.storage.Reference;
  public checkinPicSeqRef:any;
  public checkinPicSeq:number;
  public brewery:any;
  public beers:any;
  public user:any;
  public checkinScore:number;
  public fbRef:any;
  public checkinUsers = new Array();
  public notifyFriends:boolean;

  constructor(public navCtrl: NavController, 
  	          public params: NavParams,
  	          public view: ViewController,
  	          public geo:GoogleService,
              public toastCtrl:ToastController,
              public alertCtrl:AlertController,
              public modalCtrl:ModalController,
              public platform:Platform,
              public sing:SingletonService,
              public notify:NotificationService,
              public beerAPI:BreweryService,
              public auth:AuthService,
              public actionCtrl:ActionSheetController,
              public angFire:AngularFire,
              public demo:DemoService,
              public loadingCtrl:LoadingController) {

    this.beer = params.get('beer');
    this.checkinType = params.get('checkinType');  //beer,brewery,places
    this.price = 0;
    this.checkinScore = 0;
    this.checkin = firebase.database();
    
    this.usersRef = firebase.database();
    this.checkinPictureRef = firebase.storage().ref('/checkins/');
    this.checkinPicSeqRef = firebase.database().ref('/sequences/checkinIMG/');

    this.checkinLocationRF = firebase.database();
    this.checkinUserRF = firebase.database();
    this.checkinBeerRF = firebase.database();
    this.checkinBreweryRF = firebase.database();
    this.fbRef = firebase.database();

    if (this.checkinType == 'place') {
      this.locations = new Array();
      this.locations.push(params.get('location'));
    }

    if (this.checkinType == 'brewery') {
      this.brewery = params.get('brewery');
      this.locations = new Array();
      this.locations.push(params.get('location'));
      this.beers = params.get('beers');
    }
    
  }

  fixBeer() {

    if (this.beer != null) {
      if (!this.beer.hasOwnProperty('breweries')) {
        this.beer['breweries'] = new Array({name:''}); // fix beers without breweries
      }

      // fix beers with no images
      if (!this.beer.hasOwnProperty('labels')) {
        this.beer['labels'] = {medium:''};
      }
    }
  }   

  moreDetail() {
    console.log('details page');
  }

  cancel() {
    this.view.dismiss();
  }

  priceSiderFormat(price) {
    return price.toFixed(2);
  }

  removeBeer() {
    this.beer = null;
  }

  takePicture(sourceType) {

    var options = {
      quality: 90,
      targetWidth: 500,
      targetHeight: 500,
      //allowEdit: true,
      encodingType: Camera.EncodingType.PNG,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };
   
    Camera.getPicture(options).then((imageData) => {
      // imageData is a base64 encoded string
        this.base64Image = "data:image/png;base64," + imageData;
        this.imageToUpload = imageData;
    }, (err) => {
        console.log(err);
    });
  }

  deletePicture() {
    this.base64Image = null;
  }  

  pictureActions() {
    let actionSheet = this.actionCtrl.create({
      title: 'Choose what you want to do with photo.',
      buttons: [
        {
          text: 'Load from Library',
          handler: () => {
            this.takePicture(Camera.PictureSourceType.PHOTOLIBRARY);
          }
        },{
          text: 'Use Camera',
          handler: () => {
            this.takePicture(Camera.PictureSourceType.CAMERA);   
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();    
  }

  getCheckinPicSeq() {
   return new Promise(resolve=>{
    let checkinSeq = null;
    this.checkinPicSeqRef.transaction(value=>{
      checkinSeq = (value||0)+1;
      return (value||0)+1;
    },(complete)=>{
      resolve(checkinSeq);
    });
   });
  }

  getImgSeqDirectory(num) {
    let str:String = String(num);
    var pad = "000000000000";
    var ans = pad.substring(0, pad.length - str.length) + str;
    let sub1 = ans.substring(0,3);
    let sub2 = ans.substring(3,6);
    let sub3 = ans.substring(6,9);
    let img = ans+'.png';
    return {sub1:sub1,sub2:sub2,sub3:sub3,img:img}; 
  }

  fixLocations(lat,lng) {

   let ptypes = '';
  
   for (var i = 0; i < this.locations.length; i++ ) {

      ptypes ='';
     
      for (var j = 0; j < this.locations[i].types.length; j++) {
          
          if (this.locations[i].types[j] == 'bar'
              || this.locations[i].types[j] == 'night_club'
              || this.locations[i].types[j] == 'convenience_store'
              || this.locations[i].types[j] == 'gas_station'
              || this.locations[i].types[j] == 'liquor_store'
              || this.locations[i].types[j] == 'food'
              || this.locations[i].types[j] == 'restaurant'
              || this.locations[i].types[j] == 'grocery_or_supermarket') {
            ptypes += this.locations[i].types[j] + ', ';
            break;
          }
      }

      let locPoint = {lat:this.locations[i].geometry.location.lat,lng:this.locations[i].geometry.location.lng};
      let userPoint = {lat:lat,lng:lng};
      this.locations[i]['dist'] = this.geo.getDistance(locPoint,userPoint);
      this.locations[i].place_types = ptypes.replace(/,\s*$/, "").replace(/_/g, " ").replace(/\b[a-z]/g,function(f){return f.toUpperCase();});
    }
    this.locations.sort(this.compare);
    //console.log(locations);

  }

  compare(a,b) {
    if (a.dist < b.dist)
      return -1;
    if (a.dist > b.dist)
      return 1;
    return 0;
  }

  slideChanged() {
    let currentIndex = this.slides.getActiveIndex();
    //console.log("Current index is", currentIndex);
    this.slideIndex = currentIndex;
  }

  selectBeer() {
    let modal = this.modalCtrl.create(CheckinSelectBeerPage,{ 
                                        location:this.location,
                                        name:this.locationName,
                                        checkinType:this.checkinType,
                                        breweryBeers:this.beers
                                      });
    modal.onDidDismiss(beer => {
      //console.log('beer',beer);
      if (beer!=null) {
        this.beer = beer;
        this.fixBeer();
      }
    });
    modal.present();     
  }

  clearCheckinFriends() {
    this.checkinUsers = new Array();
    this.notifyFriends = false;
  }

  checkinBeer() {

    this.fixBeer();

    Geolocation.getCurrentPosition().then((resp) => {

      this.beerAPI.loadBeerGlassware().subscribe(glass=>{
        this.glassware = glass.data;
        //console.log(this.glassware);
      },error=>{
        console.log('error',error)
      });

      if ( this.sing.test ) {

        this.lat = this.sing.lat;
        this.lng = this.sing.lng;

      } else {

        this.lat = resp.coords.latitude;
        this.lng = resp.coords.longitude;

      }
      
      this.geo.placesNearByMe(this.lat,this.lng)
        .subscribe((success)=>{
          this.locations = {};
          this.locations = success.results;
          this.locationsLen = this.locations.length;

          if(this.locationsLen) {

            this.fixLocations(this.lat,this.lng);
            //console.log('resp',this.locations);

            if (this.locationsLen == 1) {
              this.showPager = false;
            }

            this.promises = new Array()
            for(var i = 0; i < this.locations.length; i++) {
              if (this.locations[i].hasOwnProperty('photos')) {
                this.promises.push(this.getLocationPhotos(this.locations[i].photos[0].photo_reference,i));
              } else {
                this.locations[i]['url'] = null;
              }
            }

            Promise.all(this.promises).then( values => {
              //console.log('val',values);
              this.showLocationSlide = true;       
                
            }).catch((error)=>{
              console.log('error with google',error);
            });
          }

        });
    }).catch((error) => {
       console.log('error with geolocation',error);
    });    
  }

  checkinPlace() {
    this.slideIndex = 0;
    this.locationsLen = 1;
    this.showLocationSlide = true;
    this.showPager = false;
    this.locationName = this.locations[0].name;

    this.location = this.locations[0];

    this.beerAPI.loadBeerGlassware().subscribe(glass=>{
      this.glassware = glass.data;
      //console.log(this.glassware);
    },error=>{
      console.log('error',error);
    });

    if (this.locations[0].hasOwnProperty('photos')) {
      this.getLocationPhotos(this.locations[0].photos[0].photo_reference,0);
    }
  }

  checkinBrewery() {
    this.slideIndex = 0;
    this.locationsLen = 1;
    this.showLocationSlide = true;
    this.showPager = false;
    this.locationName = this.brewery.name;

    this.beerAPI.loadBeerGlassware().subscribe(glass=>{
      this.glassware = glass.data;
      //console.log(this.glassware);
    },error=>{
      console.log('error',error);
    });
    if (this.locations != null) {
      this.location = this.locations[0];
      this.location['name'] = this.brewery.name;
      this.location['place_types'] = this.brewery.locationTypeDisplay;
      this.location['vicinity'] = this.brewery.streetAddress + ', ' + this.brewery.locality;
      //this.location['place_types'] = this.brewery.;
      if (this.locations[0].hasOwnProperty('photos')) {
        this.getLocationPhotos(this.locations[0].photos[0].photo_reference,0);
      }
    } else {
      this.location = {
        name: this.brewery.name,
        place_types: this.brewery.locationTypeDisplay,
        vicinity:this.brewery.streetAddress + ', ' + this.brewery.locality
      };

    }
    console.log('brewery',this.brewery);
    //console.log('location',this.location);    
  }

  ionViewDidLoad() {

    console.log('ionViewDidLoad CheckinPage');
    this.user = this.auth.getUser();
    console.log('user',this.user);

    switch(this.checkinType) {

      case 'beer':
        this.checkinBeer(); 
        break;
      case 'place':
        this.checkinPlace();
        break;
      case 'brewery':
        this.checkinBrewery();
        break;             
      default: console.log('not valid search');
    }
  }

  getBackgroundImg(pic) {
    let img:any;
    img = {backgroundImage:''};
   
    if(pic == null)
      return;
    else {
      img.backgroundImage = 'url('+pic+')';
      return img;
    }
  }  

  getLocationPhotos(picId,index) {
    return new Promise(resolve=>{

      this.geo.placePhotos(picId).subscribe(res=>{
        //console.log('photos',res);
        this.locations[index]['url'] = res.url;
        resolve(true);
      },error=>{
        console.log('error',error);
      });
    });
  }

  tagFriends() {
    let modal = this.modalCtrl.create( FriendsPage,{mode:'checkin'});
    modal.onDidDismiss(friendList => {

      if (friendList != null) {
        this.checkinUsers = friendList;
        this.notifyFriends = true;
      }
      //console.log('checkinUsers',this.checkinUsers);
    });
    modal.present();  
      
  }

  shareOnFacebook() {

    SocialSharing.shareViaFacebook('message me',null,'http://benderapp.com').then((success)=>{
       //Enter bender points here
    }).catch((error) => {
       this.presentAlert("Make sure you have the Facebook app installed.");
    });

  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }

  presentAlert(msg) {
    let alert = this.alertCtrl.create({
      title: 'error',
      subTitle: msg,
      buttons: ['Dismiss']
    });
    alert.present();
  }

  presetNoBeerSelected() {

    let alert = this.alertCtrl.create({
      title: 'No beer selected',
      message: 'Need to Select a Beer to Checkin',
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Select Beer',
          handler: () => {
            //this.getLocationDetail(location);
          }
        }
      ]
    });
    alert.present();         
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Checking in. Please wait...'
    });
    this.loading.present();
  }

  // Can only checkin the same beer 1 minute at a time
  // Also, prevent code from bugging out doing mutiple checkins.
  canCheckIn() {

    //console.log('currtime',currentTime);
    //console.log('prevTime',prevTime);

   if (this.sing.canCheckIn(this.beer.id)) {
      return true;
    } else {
      //console.log('have to wait');
      this.presentToast("Have to wait 30 seconds to post another checkin");
      return false;
    }
  }

  doCheckin() {

    if (this.beer == null) {
      this.presetNoBeerSelected();
      return;
    }
    
    if(!this.canCheckIn())
      return;      
    
    this.sing.setCheckinTime(new Date().getTime(),this.beer.id);

    let locationData:any = {};

    this.showLoading();

    if (this.locationsLen) {
      this.location = this.locations[this.slideIndex];
      console.log(this.location);
    } else
      this.location = null;

    //console.log('checkin',this.location);

    if (this.location!=null) {

      this.geo.reverseGeocodeLookup(this.location.geometry.location.lat,this.location.geometry.location.lng)
      .subscribe((success)=> {

        this.checkinScore += 25;  // base checkin point 
        if (this.base64Image != null) // picture taken. Plus 10 points
          this.checkinScore += 10;        

        if (this.socialMessage.length > 10)
          this.checkinScore += 10;

        if (this.beerRating!=0 && this.beerRating!=null)
            this.checkinScore += 5; // gave rating +5

        if (this.servingStyleName != null)
          this.checkinScore += 5; // set beer container. +5  
      
        locationData = {
          uid:this.user.uid,
          userIMG:this.user.photoURL,
          userName:this.user.displayName,
          breweryId:'',
          breweryDBId:'',
          placeId:this.location.place_id,
          name:this.location.name,
          photo:this.location.url,
          placeType:this.location.place_types,
          lat:this.location.geometry.location.lat,
          lng:this.location.geometry.location.lng,
          address:success.address,
          city:success.city,
          state:success.state,
          zip:success.zip,
          country:success.country,
          comments:this.socialMessage,
          friends:this.checkinUsers,
          img:'',
          isBrewery:'N'
        }



        if (this.checkinType == 'brewery') {
          locationData['breweryDBId'] = this.brewery.id;
          locationData['address'] = this.brewery.streetAddress;
          locationData['zip'] = this.brewery.postalCode;
          locationData['isBrewery'] = 'Y';
        }

        if (this.beer != null) {

          locationData['beerId'] = this.beer.id;
          locationData['beerName'] = this.beer.name;
          locationData['beerDisplayName'] = this.beer.nameDisplay;
          locationData['beerStyleName'] = '';
          locationData['beerStyleShortName'] = '';

          if (this.beer.hasOwnProperty('labels')) {
            locationData['beerLabels'] = this.beer.labels;
            locationData['beerLabelIcon'] = this.beer.labels.icon;
            locationData['beerLabelMedium'] = this.beer.labels.medium;
            locationData['beerLabelLarge'] = this.beer.labels.large;

            if (this.beer.labels.hasOwnProperty('medium'))
              locationData['beerIMG'] = this.beer.labels.medium;
            else
              locationData['beerIMG'] = '';

          } else {
            locationData['beerLabels'] = '';
            locationData['beerIMG'] = '';
            locationData['beerLabelIcon'] = '';
            locationData['beerLabelMedium'] = '';
            locationData['beerLabelLarge'] = '';            
          }

          if (this.beer.hasOwnProperty('style')) {
            locationData['beerStyleName'] = this.beer.style.name;
            locationData['beerStyleShortName'] = this.beer.style.shortName;
            locationData['beerCategoryName'] = this.beer.style.category.name;
          }

          if (this.beer.hasOwnProperty('abv'))
            locationData['beerABV'] = this.beer.abv;
          else
            locationData['beerABV'] = '';

          if (this.beer.hasOwnProperty('ibu'))
            locationData['beerIBU'] = this.beer.ibu;
          else
            locationData['beerIBU'] = '';        

          if (this.beerRating!=0 && this.beerRating!=null) {
            locationData['beerRating'] = this.beerRating;
          } else
            locationData['beerRating'] = '';

          if (this.beer.hasOwnProperty('breweries')) {
            locationData['breweryId'] = this.beer.breweries[0].id;
            locationData['breweryName'] = this.beer.breweries[0].name;
            locationData['breweryShortName'] = this.beer.breweries[0].nameShortDisplay;

            if (this.beer.breweries[0].hasOwnProperty('images'))
              locationData['breweryImages'] = this.beer.breweries[0].images;              
            else
              locationData['breweryImages'] = '';

          } else {
            locationData['breweryName'] = '';
            locationData['breweryShortName'] = '';
            locationData['breweryImages'] = '';           
          }
          
          if (this.servingStyleName != null)
            locationData['servingStyleName'] = this.servingStyleName;
          else
            locationData['servingStyleName'] = '';

          //set demographics for beer && set beer for locations
          this.demo.setBeerDemo(locationData).subscribe(resp=>{});  
          this.demo.setBeerByCityDemo(locationData).subscribe(resp=>{});
          this.demo.setBeerByLocation(locationData).subscribe(resp=>{});
          this.demo.setLocation(locationData).subscribe(resp=>{});

          //set checkin count for user
          this.demo.setCheckinUserCount(this.user.uid).subscribe(resp=>{});
          this.demo.setUserScore(this.user.uid,this.checkinScore).subscribe(resp=>{});
        }
        // Upload Picture and save it to firebase storage

        this.setCheckinData(locationData);

      });
    }
      
  }

  setCheckinData(locationData) {

    var offsetRef = firebase.database().ref(".info/serverTimeOffset");
    var that = this;
    

    offsetRef.on("value", function(snap) {
      var offset = snap.val();
      var negativeTimestamp = (new Date().getTime() + offset) * -1; // for ordering new checkins first
      var timestamp = new Date().getTime() + offset;
      locationData['dateCreated'] = timestamp;
      locationData['priority'] = negativeTimestamp;
      //console.log('locData',locationData);
     
      //that.checkin.push(locationData);
      var newKey;
      var newFeedRef;
      
      newFeedRef = that.checkin.ref('/checkin/feeds/').push(locationData);

      newFeedRef.then(resp=>{

        newKey = newFeedRef.key;
        var updates = {};

        if (that.notifyFriends) {
          that.notify.notifyFriends(that.user,that.checkinUsers,that.location,that.beer,negativeTimestamp,newKey);
        }      

        if (that.checkinType != 'brewery') 
          updates['/checkin/locations/'+that.location.place_id+'/'+newKey] = locationData;

        updates['/checkin/users/'+that.user.uid+'/'+newKey] = locationData;
        updates['/checkin/beers/'+that.beer.id+'/'+newKey] = locationData;

        if (that.checkinType == 'brewery' && that.brewery != null)
          updates['/checkin/brewery/'+ that.brewery.id+'/'+newKey] = locationData;

        that.fbRef.ref().update(updates).then(success=>{
          if (that.base64Image != null) {
            that.setCheckinIMG(newKey);
          } else {
            that.view.dismiss();
            that.presentToast("Check-in was successful");
            that.loading.dismiss();           
          } 
        }).catch(error=>{
          console.log('main checkin error',error);
        });        
      }).catch(error=>{
        console.log('main checkin error',error);
      });
    });        
  }

  setCheckinIMG(key) {
    let downloadURL;
    //let fbRef = firebase.database();

    this.getCheckinPicSeq().then(value=>{
      let subDir = this.getImgSeqDirectory(value);
      this.checkinPictureRef.child(subDir.sub1)
        .child(subDir.sub2)
        .child(subDir.sub3)
        .child(subDir.img)
        .putString(this.imageToUpload,'base64',{contentType:'image/png'})
        .then(resp=>{

          downloadURL = resp.downloadURL;
          if (downloadURL!=null) {
            var imgUpdates = {};
            imgUpdates['/checkin/feeds/'+key+'/img'] = downloadURL;

            if (this.checkinType != 'brewery')
              imgUpdates['/checkin/locations/'+this.location.place_id+'/'+key+'/img'] = downloadURL;

            imgUpdates['/checkin/users/'+this.user.uid+'/'+key+'/img'] = downloadURL;
            imgUpdates['/checkin/beers/'+this.beer.id+'/'+key+'/img'] = downloadURL;
            
            if (this.checkinType == 'brewery' && this.brewery != null)
              imgUpdates['/checkin/brewery/'+this.brewery.id+'/'+key+'/img'] = downloadURL;

            this.fbRef.ref().update(imgUpdates,complete=>{
              this.view.dismiss();
              this.presentToast("Check-in was successful");
              this.loading.dismiss();               
            });
          }
      }).catch(error=>{
        console.log('error setCheckinIMG', error);
      });            
    });    
  }

  maxText(msg) {
    //return 150 - msg.length;
    let message = String(msg);
    return this.maxMsgLen - message.length;
  }

  selectLocation(index) {
    this.locChoice = index;
    //console.log(this.locChoice);
  }

}
