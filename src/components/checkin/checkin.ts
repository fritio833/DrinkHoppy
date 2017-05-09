import { Component,Input, Output, ChangeDetectionStrategy  } from '@angular/core';
import { NavController, NavParams} from 'ionic-angular';
import firebase from 'firebase';

import { SingletonService } from '../../providers/singleton-service';

import { ProfilePage } from '../../pages/profile/profile';
import { CheckinDetailPage } from '../../pages/checkin-detail/checkin-detail';
import { AchievementsDetailPage } from '../../pages/achievements-detail/achievements-detail';



@Component({
  selector: 'checkin',
  templateUrl: 'checkin.html'
  //changeDetection: ChangeDetectionStrategy.OnPush
})


export class CheckinComponent {

  @Input ('checkin') checkToUse;
  @Input ('page') pageToUse;
  @Input ('id') pageId;
  public check:any;
  public checkPage:any;
  public checkinPageId:any;
  public beerRating:any;
  public checkinTime:string;
  public fbRef:any;
  public userName:string;
  public achievements = new Array();

  constructor(public sing:SingletonService, 
              public navCtrl:NavController ) {
    //console.log('Hello Checkin Component');
    this.check = {};
    this.fbRef = firebase.database();
  }

  ngOnInit() {

    this.check = this.checkToUse;
    this.checkPage = this.pageToUse;
    this.checkinPageId = this.pageId;

    if (this.check.beerRating == '')
      this.beerRating = 0;
    else
      this.beerRating = this.check.beerRating;

    this.fbRef.ref('/users/'+this.check.uid).once('value').then(snapshot=>{
      this.userName = snapshot.val().name;
    });

     this.checkinTime = this.getTimestamp(this.check.dateCreated);
     //this.cdRef.detectChanges();
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

  getCheckinDetail(key) {

    this.navCtrl.push(CheckinDetailPage,{checkinKey:key,page:this.checkPage,checkinPageId:this.checkinPageId});
  }

  getTimestamp(prevTime) {
    return this.sing.timeDifference(new Date().getTime(),prevTime,true);
  }

  getLocation() {

    console.log('checkin clicked');
  }

  getAchievement(key) {
    this.navCtrl.push(AchievementsDetailPage,{achieveId:key,uid:null})
  }

  getProfile(uid) {
    this.navCtrl.push(ProfilePage,{uid:uid,lookup:true});
  }


}
