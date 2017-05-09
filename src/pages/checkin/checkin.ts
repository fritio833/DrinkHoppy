import { Component, ViewChild } from '@angular/core';
import { NavController, Platform, ModalController, ActionSheetController } from 'ionic-angular';
import { Slides, NavParams, ViewController, LoadingController, AlertController, ToastController } from 'ionic-angular';
import 'rxjs/add/observable/forkJoin';
import { Observable } from 'rxjs/Observable';
import { Geolocation, SocialSharing, Camera } from 'ionic-native';
import { Ionic2RatingModule } from 'ionic2-rating';
import { Storage } from '@ionic/storage';

import { AngularFire, FirebaseListObservable } from 'angularfire2';
import firebase from 'firebase';

import { GoogleService } from '../../providers/google-service';
import { BreweryService } from '../../providers/brewery-service';
import { SingletonService } from '../../providers/singleton-service';
import { AuthService } from '../../providers/auth-service';
import { DemoService } from '../../providers/demo-service';
import { NotificationService } from '../../providers/notification-service';
import { AchievementsService } from '../../providers/achievements-service';

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
  public successfulCheckin:boolean = false;
  public achievements = new Array();
  public checkinPoints = new Array();

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
              public storage:Storage,
              public achieve:AchievementsService,
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
        this.beer['labels'] = {medium:'',icon:'',large:''};
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
   return new Promise((resolve,reject)=>{
     let checkinSeq = null;
     this.checkinPicSeqRef.transaction(value=>{
       checkinSeq = (value||0)+1;
       return (value||0)+1;
      },(error,committed,snapshot)=>{        
       if (error) {
         reject(error);
       } else if(committed) {
         resolve(checkinSeq);
       } else {
         reject(true);
       }
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
    let locationRating = 0;

    this.showLoading();

    if (this.locationsLen) {
      this.location = this.locations[this.slideIndex];
      console.log(this.location);
    } else
      this.location = null;

    //console.log('checkin',this.location);

    if (this.location!=null) {
      this.setCheckinLocation();
    } else {
      this.setCheckinWithNoLocation();
    }
      
  }

  setCheckinWithNoLocation() {
      let beerData:any = {};
      this.successfulCheckin = true;
      this.loading.dismiss().catch(()=>{});

      beerData = {
        uid:this.user.uid,
        userIMG:this.user.photoURL,
        userName:this.user.displayName,
        breweryId:'',
        breweryDBId:'',
        placeId:'',
        name:'',
        photo:'',
        placeType:'',
        lat:'',
        lng:'',
        address:'',
        city:'',
        state:'',
        zip:'',
        locationRating:'',
        country:'',
        comments:this.socialMessage,
        friends:this.checkinUsers,
        img:'',
        isBrewery:'N'
      }

      this.setBeerData(beerData);

      this.sing.getGeolocation().subscribe(geo=>{
        console.log('geo',geo);

           this.geo.reverseGeocodeLookup(geo.latitude,geo.longitude).subscribe((success) => { 
             
              beerData['address'] = success.address;
              beerData['city'] = success.city;
              beerData['state'] = success.state;
              beerData['zip'] = success.zip;
              beerData['lat'] = geo.latitude;
              beerData['lng'] = geo.longitude;

              this.demo.setBeerDemo(beerData).subscribe(resp=>{});

              // Upload Picture and save it to firebase storage
              if (this.base64Image != null) {
                this.setCheckinIMG().then(downloadURL=>{
                  beerData['img'] = downloadURL;
                  this.setCheckinData(beerData);
                }).catch(error=>{
                  console.log('error uploadImg',error);
                });
              } else {
                this.setCheckinData(beerData);
              }              
           },error=>{
             console.log('error reverseGeocodeLookup',error);
             this.loading.dismiss();             
           }); 

      },error=>{
        // Failed to find geo location.
        // Upload Picture and save it to firebase storage
        if (this.base64Image != null) {
          this.setCheckinIMG().then(downloadURL=>{
            beerData['img'] = downloadURL;
            this.setCheckinData(beerData);
          }).catch(error=>{
            console.log('error uploadImg',error);
          });
        } else {
          this.setCheckinData(beerData);
        } 
      });     
  }

  setCheckinLocation() {
    let locationData:any = {};
    let locationRating = 0;

    this.geo.reverseGeocodeLookup(this.location.geometry.location.lat,this.location.geometry.location.lng)
    .subscribe((success)=> {

      this.checkinScore += 25;  // base checkin point
      this.checkinPoints.push('Checked in at a location - 25'); 
      if (this.base64Image != null) { // picture taken. Plus 10 points
        this.checkinScore += 10;
        this.checkinPoints.push('Picture taken - 10');
      }   

      if (this.socialMessage.length < 20 && this.socialMessage.length > 1) {
        this.checkinScore += 10;
        this.checkinPoints.push('Left a short comment - 10');
      }
      
      if (this.socialMessage.length > 20) {
        this.checkinScore += 15;
        this.checkinPoints.push('Left a descriptive comment - 15');        
      }

      if (this.beerRating!=0 && this.beerRating!=null) {
        this.checkinScore += 5; // gave rating +5
        this.checkinPoints.push('Gave a beer rating - 5'); 
      }

      if (this.servingStyleName != null) {
        this.checkinScore += 5; // set beer container. +5
        this.checkinPoints.push('Selected serving style - 5'); 
      }

      if (this.checkinUsers.length) {
        this.checkinScore += 5; // set beer container. +5
        this.checkinPoints.push('Tagged a friend - 5'); 
      }      

      if (this.location.hasOwnProperty('rating'))
        locationRating = this.location.rating;
    
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
        locationRating:locationRating,
        country:success.country,
        comments:this.socialMessage,
        friends:this.checkinUsers,
        achievements:'',
        img:'',
        isBrewery:'N'
      }

      // Google inserts maps image.  We want to remove it.
      if (locationData['photo'].indexOf('maps') != -1) {
        locationData['photo'] = '';
      }

      if (this.checkinType == 'brewery') {
        locationData['breweryDBId'] = this.brewery.id;
        locationData['address'] = this.brewery.streetAddress;
        locationData['zip'] = this.brewery.postalCode;
        locationData['isBrewery'] = 'Y';
      }

      if (this.beer != null) {

        this.setBeerData(locationData);

        //this.achieve.setCountAchievement(locationData);
        //console.log('locData',locationData);
        //set demographics for beer && set beer for locations
        Observable.forkJoin(
          this.demo.setBeerDemo(locationData),  // 0  
          this.demo.setBeerByCityDemo(locationData), // 1
          this.demo.setBeerByLocation(locationData), // 2
          this.demo.setLocation(locationData),  // 3
          this.demo.setLocationbyCityDemo(locationData), // 4
          this.demo.setCheckinUserCount(this.user.uid), // 5
          this.demo.setUserScore(this.user.uid,this.checkinScore,locationData), // 6        
          this.demo.setBreweryByCity(locationData)).subscribe(resp=>{ // 7
            console.log('fork resp',resp);
            
            if (resp[2]) {
              this.checkinScore += 25; // set beer container. +5
              this.checkinPoints.push('Checked-in a new beer at this locaiton - 25');               
            }

            if (resp[3]) {
              this.checkinScore += 25; // set beer container. +5
              this.checkinPoints.push('First to check-in at this locaiton - 50');               
            }

            Observable.forkJoin(
              this.achieve.getAchievement(this.user.uid,locationData.beerCategoryName,'beerCategory'),
              this.achieve.setCountAchievement(this.user.uid,resp[5])).subscribe(achieve=>{
              let achieveArray = new Array();
              let achieveCount = 0;
              for (var i = 0; i < achieve.length; i++) {
                if (achieve[i]) {
                  achieveCount++;
                  this.achievements.push(achieve[i]);
                  achieveArray.push({key:achieve[i]['key'],img:achieve[i]['img']});
                }
              }

              if (achieveCount) {
                locationData['achievements'] = achieveArray;
              }

              console.log('achieve',this.achievements);
              /*
              if (achieve) {
                this.achievements.push(achieve[1]);
                console.log('location achieve',achieve[1]);
                locationData['achievements'] = achieve['key']; 
              } 
              */            

              // Upload Picture and save it to firebase storage
              if (this.base64Image != null) {
                this.setCheckinIMG().then(downloadURL=>{
                  locationData['img'] = downloadURL;
                  this.setCheckinData(locationData);
                }).catch(error=>{
                  console.log('error uploadImg',error);
                });
              } else {
                this.setCheckinData(locationData);
              }

            });
        },error=>{
          console.log('fork error',error);
           this.loading.dismiss().catch(()=>{});
        });
      }

    },error=>{
      console.log('error reverseGeocodeLookup',error);
      this.loading.dismiss();
    });
  }

  setBeerData(beerData) {

        beerData['beerId'] = this.beer.id;
        beerData['beerName'] = this.beer.name;
        beerData['beerDisplayName'] = this.beer.nameDisplay;
        beerData['beerStyleName'] = '';
        beerData['beerStyleShortName'] = '';

        if (this.beer.hasOwnProperty('labels')) {
          beerData['beerLabels'] = this.beer.labels;
          beerData['beerLabelIcon'] = this.beer.labels.icon;
          beerData['beerLabelMedium'] = this.beer.labels.medium;
          beerData['beerLabelLarge'] = this.beer.labels.large;

          if (this.beer.labels.hasOwnProperty('medium'))
            beerData['beerIMG'] = this.beer.labels.medium;
          else
            beerData['beerIMG'] = '';

        } else {
          beerData['beerLabels'] = '';
          beerData['beerIMG'] = '';
          beerData['beerLabelIcon'] = '';
          beerData['beerLabelMedium'] = '';
          beerData['beerLabelLarge'] = '';            
        }

        if (this.beer.hasOwnProperty('style')) {
          beerData['beerStyleName'] = this.beer.style.name;
          beerData['beerStyleShortName'] = this.beer.style.shortName;
          beerData['beerCategoryName'] = this.beer.style.category.name;
        }

        if (this.beer.hasOwnProperty('abv'))
          beerData['beerABV'] = this.beer.abv;
        else
          beerData['beerABV'] = '';

        if (this.beer.hasOwnProperty('ibu'))
          beerData['beerIBU'] = this.beer.ibu;
        else
          beerData['beerIBU'] = '';        

        if (this.beerRating!=0 && this.beerRating!=null) {
          beerData['beerRating'] = this.beerRating;
        } else
          beerData['beerRating'] = '';

        if (this.beer.hasOwnProperty('breweries')) {
          beerData['breweryId'] = this.beer.breweries[0].id;
          beerData['breweryName'] = this.beer.breweries[0].name;
          beerData['breweryShortName'] = this.beer.breweries[0].nameShortDisplay;

          if (this.brewery != null && this.brewery.hasOwnProperty('locationTypeDisplay'))
            beerData['breweryType'] = this.brewery.locationTypeDisplay;
          else
            beerData['breweryType'] = '';

          if (this.beer.breweries[0].hasOwnProperty('images'))
            beerData['breweryImages'] = this.beer.breweries[0].images;              
          else
            beerData['breweryImages'] = '';

        } else {
          beerData['breweryName'] = '';
          beerData['breweryShortName'] = '';
          beerData['breweryImages'] = '';           
        }
        
        if (this.servingStyleName != null)
          beerData['servingStyleName'] = this.servingStyleName;
        else
          beerData['servingStyleName'] = '';

  }


  setCheckinData(locationData) {

    var offsetRef = firebase.database().ref(".info/serverTimeOffset");
    var that = this;
    var writeCheckinListender;
    

    offsetRef.once("value").then(snap=> {
      var offset = snap.val();
      var updates = {};
      var newKey;
      var newFeedRef;      
      var negativeTimestamp = (new Date().getTime() + offset) * -1; // for ordering new checkins first
      var timestamp = new Date().getTime() + offset;
      locationData['dateCreated'] = timestamp;
      locationData['priority'] = negativeTimestamp;
      
      newFeedRef = that.checkin.ref('/checkin/feeds/').push(locationData);

      newKey = newFeedRef.key;

      if (that.checkinType != 'brewery' && that.location != null) 
        updates['/checkin/locations/'+that.location.place_id+'/'+newKey] = locationData;

      updates['/checkin/users/'+that.user.uid+'/'+newKey] = locationData;
      updates['/checkin/beers/'+that.beer.id+'/'+newKey] = locationData;

      if (that.checkinType == 'brewery' && that.brewery != null)
        updates['/checkin/brewery/'+ that.brewery.id+'/'+newKey] = locationData;

      that.fbRef.ref().update(updates).then(success=>{
        that.successfulCheckin = true;
        that.loading.dismiss().catch(()=>{});
              
      }).catch(error=>{
        console.log('error',error);
        that.loading.dismiss().catch(()=>{});
      });
      
    }); 
      
  }

  setCheckinIMG() {
    let downloadURL;
    return new Promise((resolve,reject)=>{

      this.getCheckinPicSeq().then(value=>{
        let subDir = this.getImgSeqDirectory(value);
        this.checkinPictureRef.child(subDir.sub1)
          .child(subDir.sub2)
          .child(subDir.sub3)
          .child(subDir.img)
          .putString(this.imageToUpload,'base64',{contentType:'image/png'})
          .then(resp=>{
           resolve(resp.downloadURL);
          }).catch(error=>{
            console.log('error setCheckinIMG', error);
            reject(error);
          });            
      }).catch(error=>{
        console.log('error getCheckinPicSeq',error);
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
