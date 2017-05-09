import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';

import { AchievementsService } from '../../providers/achievements-service';
import { SingletonService } from '../../providers/singleton-service';

@Component({
  selector: 'page-achievements-detail',
  templateUrl: 'achievements-detail.html'
})
export class AchievementsDetailPage {

  public achievement:any;
  public achieveId:any;
  public uid:any;

  constructor(public navCtrl: NavController, 
              public view: ViewController, 
              public params: NavParams, 
              public sing: SingletonService,
              public achieve:AchievementsService) {
    this.achieveId = params.get('achieveId');
    this.uid = params.get('uid');
  }

  close() {
    this.view.dismiss();
  }

  ionViewDidLoad() {
    this.achieve.getAchievementDetail(this.achieveId,this.uid).subscribe(resp=>{
      this.achievement = resp;
      console.log('achievement',this.achievement);
    });
    console.log('ionViewDidLoad AchievementsDetailPage');
  }

}
