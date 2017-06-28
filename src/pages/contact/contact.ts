import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import firebase from 'firebase';

import { AuthService } from '../../providers/auth-service';

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {

  public user_friendly:string='';
  public look_and_feel:string='';
  public responsiveness:string='';
  public data_accuracy:string='';
  public functionality:string='';
  public overall:string='';
  public tell_friend:string='';
  public pay_dollar:string='';
  public app_crash:string='';
  public hours_used:string='';
  public platform:string='';
  public device_name:string='';
  public error_description:string='';
  public improve_description:string='';
  public positive_description:string='';
  public negative_description:string='';
  public user:any;
  public fbRef:any;
  public formSubmitted:boolean = false;

  constructor(public auth:AuthService) {
    this.user = this.auth.getUser();
    this.fbRef = firebase.database();
    console.log('user',this.user);
  }

  submitFeedback(){
    let feedback = {
      user_name:this.user.displayName,
      uid:this.user.uid,
      user_friendly:this.user_friendly,
      look_and_feel:this.look_and_feel,
      responsiveness:this.responsiveness,
      data_accuracy:this.data_accuracy,
      functionality:this.functionality,
      overall:this.overall,
      tell_friend:this.tell_friend,
      app_crash:this.app_crash,
      hours_used:this.hours_used,   
      platform:this.platform,
      pay_dollar:this.pay_dollar,
      device_name:this.device_name,
      error_description:this.error_description,
      improve_description:this.improve_description,
      positive_description:this.positive_description,
      negative_description:this.negative_description,
      timestamp:firebase.database.ServerValue.TIMESTAMP
    }

    this.fbRef.ref('/feedback/').push(feedback).then(success=>{
      this.formSubmitted = true;
    }).catch(error=>{
      console.log('error submitFeedback',error);
    });
    

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ContactPage');
  }

}
