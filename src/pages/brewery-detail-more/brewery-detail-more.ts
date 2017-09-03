import { Component } from '@angular/core';
import { NavController, NavParams, Platform, AlertController, ToastController, ModalController } from 'ionic-angular';

import { GoogleService } from '../../providers/google-service';
import { SingletonService } from '../../providers/singleton-service';
import { AuthService } from '../../providers/auth-service';
import { ConnectivityService } from '../../providers/connectivity-service';

import { LocationMapPage } from '../location-map/location-map';
import { CheckinPage } from '../checkin/checkin';
import { AddBeerPage } from '../add-beer/add-beer';

declare var window: any;

@Component({
  selector: 'page-brewery-detail-more',
  templateUrl: 'brewery-detail-more.html'
})
export class BreweryDetailMorePage {

  public brewery:any;
  public location:any;
  public locationPhoto:any;
  public locationOpen:any;
  public locationRating:any;
  public breweryDescription:string;
  public breweryHours:string;
  public locationHours:any;
  public breweryBeers:any;

  constructor(public navCtrl: NavController, 
  	          public params: NavParams,
  	          public platform: Platform,
              public sing: SingletonService,
              public modalCtrl:ModalController,
              public auth:AuthService,
              public alertCtrl:AlertController,
              public toastCtrl:ToastController,
              public conn:ConnectivityService,
  	          public geo:GoogleService) {
  	this.brewery = params.get('brewery');
    this.location = params.get('location');
    this.locationPhoto = params.get('photo');
    this.breweryBeers = params.get('beers');
    //console.log('locBrew',this.location);
    //console.log('brewInfo',this.brewery);
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

  callIt(phoneNo) {
    phoneNo = encodeURIComponent(phoneNo);
    window.location = "tel:"+phoneNo;
  }
  
  priceLevel(price) {
    let str = '';
    switch(price) {
      case 1: str = '$ - Very Affordable'; break;
      case 2: str = '$$ - Affordable'; break;
      case 3: str = '$$$ - Expensive'; break;
      case 4: str = '$$$$ - Very Expensive'; break;
      default: str = '';
    }
    return str;
  }

  checkIn() {
    
    if (this.sing.isOnline()) {

      if (!this.breweryBeers.length) {
        this.presentAlert();
        return;
      }      

      this.sing.canUserCheckin(this.auth.userRole,this.brewery.latitude,this.brewery.longitude).subscribe(canCheckIn=>{
        if (canCheckIn['checkin']) {
          let modal = this.modalCtrl.create(CheckinPage,{
                                                          checkinType:'brewery',
                                                          brewery:this.brewery,
                                                          location:this.location,
                                                          beers:this.breweryBeers
                                                        });
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

  viewMap() {
    let modal = this.modalCtrl.create(LocationMapPage,
                                      { lat:this.brewery.latitude,
                                        lng:this.brewery.longitude,
                                        locName:this.location.name
                                      });
    modal.present();
  }   

  getGoogleStaticMap() {
      return this.geo.getStaticMap(this.brewery.latitude,this.brewery.longitude);
  }

  goToNavApp() {
      let destination = this.brewery.latitude + ',' + this.brewery.longitude;

      if(this.platform.is('ios')){
        window.open('maps://?q=' + destination, '_system');
      } else {
        let label = encodeURIComponent(this.location.name);
        window.open('geo:0,0?q=' + destination + '(' + label + ')', '_system');
      }    
  }
      
  goToPlaceWebsite(url) {
    window.open(encodeURI(url),'_system');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad BreweryDetailMorePage');

    // get rating from google places
    if (this.location != null && this.location.hasOwnProperty('rating'))
      this.locationRating = this.location.rating;   

    // check if open
    if (this.location != null && this.location.hasOwnProperty('opening_hours'))
      this.locationOpen = this.location.opening_hours.open_now;

    if (this.brewery.hasOwnProperty('brewery')) {
      this.breweryDescription = this.brewery.brewery.description;
    } else {
      this.breweryDescription = null;	
    }

    if (this.location.hasOwnProperty('opening_hours')) {

      this.locationHours = this.location.opening_hours.weekday_text;

    } else if (this.brewery.hasOwnProperty('hoursOfOperation')) {

      this.breweryHours = this.brewery.hoursOfOperation;

    } else {
      this.breweryHours = null;
      this.locationHours = null;	
    }    

  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }

  presentAlert() {
    let networkAlert = this.alertCtrl.create({
      title: 'Sorry!',
      message: 'This brewery as no beers to view or check-in. Help us grow by adding one.',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {}
        },
        {
          text: 'Add New Beer',
          handler: () => {
            this.addBeer();
          }
        }
      ]
    });
    networkAlert.present();
  }

  addBeer() {
    let modal = this.modalCtrl.create(AddBeerPage,
                                      { breweryId:this.brewery.breweryId,
                                        locName:this.brewery.brewery.name
                                      });
    modal.present();
  }   

}
