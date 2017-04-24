import { Component,Input, Output, ChangeDetectionStrategy  } from '@angular/core';
import { NavController, NavParams} from 'ionic-angular';

import { SingletonService } from '../../providers/singleton-service';

import { ProfilePage } from '../../pages/profile/profile';
import { CheckinDetailPage } from '../../pages/checkin-detail/checkin-detail';


@Component({
  selector: 'checkin',
  templateUrl: 'checkin.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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

  constructor(public sing:SingletonService, 
              public navCtrl:NavController ) {
    //console.log('Hello Checkin Component');
    this.check = {};
  }

  ngOnInit() {

    this.check = this.checkToUse;
    this.checkPage = this.pageToUse;
    this.checkinPageId = this.pageId;

    if (this.check.beerRating == '')
      this.beerRating = 0;
    else
      this.beerRating = this.check.beerRating;

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
    console.log('key',key);
    console.log('page',this.checkPage);

    this.navCtrl.push(CheckinDetailPage,{checkinKey:key,page:this.checkPage,checkinPageId:this.checkinPageId});
  }

  getTimestamp(prevTime) {
    return this.sing.timeDifference(new Date().getTime(),prevTime,true);
  }

  getLocation() {

    console.log('checkin clicked');
  }

  getProfile(uid) {
    this.navCtrl.push(ProfilePage,{uid:uid,lookup:true});
  }

}
