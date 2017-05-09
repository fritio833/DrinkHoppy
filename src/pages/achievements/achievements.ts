import { Component } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';

import { AchievementsService } from '../../providers/achievements-service';
import { AchievementsDetailPage } from '../achievements-detail/achievements-detail';

@Component({
  selector: 'page-achievements',
  templateUrl: 'achievements.html'
})
export class AchievementsPage {

  public achievements:any;
  public uid:string;

  constructor(public navCtrl: NavController, 
              public params: NavParams,
              public modalCtrl: ModalController, 
              public achieve: AchievementsService) {
    this.uid = params.get('uid');
  }

  getAllAchievements() {
    this.achieve.getAllAchievements(this.uid).then(achievements=>{

      this.achievements = achievements;
    });
  }

  isEarned(earned) {
    let style = {};

    if (!earned) {
      return 'gray-badge';
    } 

  }
  
  getDetail(achieveId) {
    //let modal = this.modalCtrl.create(AchievementsDetailPage,{achieveId:achieveId,uid:this.uid});
    //modal.present();
    this.navCtrl.push(AchievementsDetailPage,{achieveId:achieveId,uid:this.uid});    
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AchievementsPage');
    this.getAllAchievements();
  }

}
