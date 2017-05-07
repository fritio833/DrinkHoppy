import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController, ToastController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import firebase from 'firebase';

import { SingletonService } from '../../providers/singleton-service';
import { GoogleService } from '../../providers/google-service';
import { BreweryService } from '../../providers/brewery-service';
import { AuthService } from '../../providers/auth-service';

import { BreweryDetailPage } from '../brewery-detail/brewery-detail';
import { ProfilePage } from '../profile/profile';
import { LocationDetailPage } from '../location-detail/location-detail';
import { BeerDetailPage } from '../beer-detail/beer-detail';


@Component({
  selector: 'page-checkin-detail',
  templateUrl: 'checkin-detail.html'
})
export class CheckinDetailPage {

  public page:string;
  public checkinKey:string;
  public checkinRef:any;
  public checkinPageId:any;
  public checkin:any;
  public checkinImg:any;
  public beerCategoryName:any;
  public beerId:any
  public beerStyleName:any;
  public beerDisplayName:any;
  public beerIMG:any;
  public beerLabelMedium:any;
  public breweryId:any;
  public breweryName:any;
  public comments:any;
  public businessName:any;
  public placeType:any;
  public servingStyleName:any;
  public userName:any;
  public dateCreated:any;
  public beerRating:any;
  public userIMG:any;
  public placeId:any;
  public photo:any;
  public uid:any;
  public city:any;
  public state:any;
  public isBrewery:any;
  public lat:any;
  public lng:any;
  public loading:any;
  public fbRef:any;
  public userRep:any;
  public numCheckins:any;
  public user:any;

  constructor(public navCtrl: NavController, 
              public geo:GoogleService, 
              public params: NavParams,
              public beerAPI:BreweryService,
              public loadingCtrl:LoadingController,
              public toastCtrl: ToastController,
              public auth: AuthService,
              public alertCtrl: AlertController,
              public sing:SingletonService) {
    this.page = params.get('page');
    this.checkinKey = params.get('checkinKey');
    this.checkinPageId = params.get('checkinPageId');
    this.fbRef = firebase.database();
    this.user = this.auth.getUser();
    if (this.page == 'feeds')
      this.checkinRef = firebase.database().ref('checkin/feeds/'+this.checkinKey);
    else
      this.checkinRef = firebase.database().ref('checkin/'+this.page +'/'+this.checkinPageId+'/'+this.checkinKey);
    /*
    console.log('page',this.page);   
    console.log('checkinPageId',this.checkinPageId);
    console.log('checkinKey',this.checkinKey);
    */
  }

  getCheckin(){
    this.checkinRef.once('value').then(snapshot=>{
      this.checkinImg = snapshot.val().img;
      this.beerCategoryName = snapshot.val().beerCategoryName;
      this.beerStyleName = snapshot.val().beerStyleShortName;
      this.beerDisplayName = snapshot.val().beerDisplayName;
      this.beerIMG = snapshot.val().beerIMG;
      this.beerLabelMedium = snapshot.val().beerLabelMedium;
      this.beerId = 
      this.breweryName = snapshot.val().breweryName;
      this.comments = snapshot.val().comments;
      this.businessName = snapshot.val().name;
      this.placeType = snapshot.val().placeType;
      this.servingStyleName = snapshot.val().servingStyleName;
      //this.userName = snapshot.val().userName;
      this.dateCreated = snapshot.val().dateCreated;
      this.beerRating = snapshot.val().beerRating;
      this.userIMG = snapshot.val().userIMG;
      this.placeId = snapshot.val().placeId;
      this.photo = snapshot.val().photo;
      this.uid = snapshot.val().uid;
      this.city = snapshot.val().city;
      this.state = snapshot.val().state;
      this.isBrewery = snapshot.val().isBrewery;
      this.breweryId = snapshot.val().breweryId;
      this.lat = snapshot.val().lat;
      this.lng = snapshot.val().lng;
      this.beerId = snapshot.val().beerId;

      //console.log(snapshot.val());
      this.fbRef.ref('/users/'+this.uid).once('value').then(snapshot=>{
        this.userName = snapshot.val().name;
        this.userRep = snapshot.val().reputation;
        this.numCheckins = snapshot.val().checkins;
      });

    });
  }

  getProfile(uid) {
    this.navCtrl.push(ProfilePage,{uid:uid,lookup:true});
  }  

  getDateMonthDayYear(timestamp) {
    return this.sing.getDateMonthDayYear(timestamp);
  }

  getDetail() {
    if (this.isBrewery == 'Y')
      this.getBreweryDetail();
    else {
      this.getLocationDetail();      
    }
    //console.log('page',this.page);
  }
  getBreweryFromGoogle(breweryName,lat,lng) {
    //console.log('brewery',brewery);
    let _breweryName = encodeURIComponent(breweryName);

    return new Observable(observer=>{
      this.geo.getPlaceByOrigin(_breweryName,lat,lng).subscribe(pub=>{
        if (pub.results.length) {
          //Get place detail
          this.geo.placeDetail(pub.results[0].place_id).subscribe(detail=>{
            //console.log('detail',detail);
            observer.next(detail);
          });
        } else {
          observer.next(false);
        }
      });      
    });
  
  }

  getBreweryDetail() {
    this.showLoading('Loading. Please wait...');
    this.getBreweryFromGoogle(this.breweryName,this.lat,this.lng).subscribe(brewery=>{
      //console.log('breweryObj',brewery);
          this.beerAPI.loadLocationById(this.breweryId).subscribe((pub)=>{
                  
            this.beerAPI.loadBreweryBeers(this.breweryId).subscribe((beers)=>{

                this.loading.dismiss();
                this.navCtrl.push(BreweryDetailPage,{brewery:pub.data,beers:beers,place:brewery['result']});
            },error=>{
              console.log('error',error);
              this.loading.dismiss().catch(() => {});
              this.presentToast('Could not connect. Check connection.');
            });
            
          },error=>{
            console.log('error',error);
            this.loading.dismiss().catch(() => {});
            this.presentToast('Could not connect. Check connection.');
          });      
    });
  }

  getBeerDetail() {
    this.navCtrl.push(BeerDetailPage,{beerId:this.beerId});
  }  

  getLocationDetail() {

    this.showLoading('Loading. Please wait...');
    this.geo.placeDetail(this.placeId).subscribe((resp)=>{
      //console.log('resp',resp);
      this.loading.dismiss().catch(() => {});
       this.navCtrl.push(LocationDetailPage,{location:resp.result});
    },error=>{
      console.log('error',error);
      this.loading.dismiss().catch(() => {});
      this.presentToast('Could not connect. Check connection.');
    });

  }

  showLoading(msg) {
    this.loading = this.loadingCtrl.create({
      content: msg
    });
    this.loading.present();
  }  

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }

  repUp() {

    if (this.uid === this.user.uid) {
       this.presentToast("Can't rep yourself");
      return;
    }

    this.fbRef.ref('/users/'+this.uid+'/reppedMe/'+this.user.uid).transaction(value=>{
      return true
    },(error,committed,snapshot)=>{

      if (error) {
        if ((<Error>error).message === 'permission_denied') {
          console.log('permission_denied');
          this.presentToast("You already repped " + this.userName);
        } else
          console.log('error',error);
      }

      if (committed) {
        this.fbRef.ref('/users/'+this.uid+'/reputation').transaction(value=>{
          this.presentToast("Positive Reputation Given to " + this.userName);
          return (value||0)+1;
        });        
      }
    });
  }

  repDown() {

    if (this.uid === this.user.uid) {
       this.presentToast("Can't rep yourself");
      return;
    }

    this.fbRef.ref('/users/'+this.uid+'/reppedMe/'+this.user.uid).transaction(value=>{
      return true
    },(error,committed,snapshot)=>{

      if (error) {
        if ((<Error>error).message === 'permission_denied') {
          console.log('permission_denied');
          this.presentToast("You already repped " + this.userName);
        } else
          console.log('error',error);
      }

      if (committed) {
        this.fbRef.ref('/users/'+this.uid+'/reputation').transaction(value=>{
          this.presentToast("Negative Reputation Given to " + this.userName);
          return (value||0)-1;
        });        
      }
    });    
  }

  checkinFlagged(flagReason) {
    this.fbRef.ref('/flagged_checkins/').push({
      uid:this.uid,
      name:this.userName,
      message:flagReason,
      checkinComment:this.comments,
      userIMG:this.userIMG,
      reportedUID:this.user.uid,
      reportedName:this.user.displayName,
      timestamp:firebase.database.ServerValue.TIMESTAMP,
      priority:(new Date().getTime()) * -1
    });
    this.presentToast("Message sent. Thanks for helping us keep this place clean.");
  }

  flagCheckin() {

    if (this.uid === this.user.uid) {
       this.presentToast("Can't flag yourself");
      return;
    }

    let prompt = this.alertCtrl.create({
      title: 'Flag This Check-in',
      message: "Enter the reason why.",
      inputs: [
        {
          name: 'flagReason',
          placeholder:'Reason',
          type: 'text'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Flag',
          handler: data => {
            //console.log('Saved clicked');
            this.checkinFlagged(data.flagReason);
          }
        }
      ]
    });
    prompt.present();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CheckinDetailPage');
    this.getCheckin();
  }
}
