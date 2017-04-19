import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { Validators, FormBuilder } from '@angular/forms';
import { Storage } from '@ionic/storage';

import { FbProvider } from '../../providers/fb-provider';
import { ValidationService } from '../../providers/validation-service';

import { CreateAccountFinalPage }from '../create-account-final/create-account-final';
import { MyPubPage } from '../my-pub/my-pub';


@Component({
  selector: 'page-create-account',
  templateUrl: 'create-account.html'
})
export class CreateAccountPage {

  public email:any;
  public emailForm:any;
  public name:any;
  public id:any;
  public picture:any;
  public gender:any;
  public password:any;

  constructor(public navCtrl: NavController, public params: NavParams,public alertCtrl: AlertController,public form: FormBuilder,public fb:FbProvider, public storage: Storage) {

    this.email = params.get("email");
    this.password = params.get("password");
    
    this.emailForm = this.form.group({
      email : ['',Validators.compose([Validators.required,Validators.maxLength(30),ValidationService.emailValidator])],
      password : ['',Validators.compose([Validators.required,Validators.maxLength(30)])]
    });

    console.log('user',storage.get('user'));
    storage.get('userType').then((name)=> {
      console.log('userType',name);
    });

  }

  showCreateAccountFinal() {
  	this.navCtrl.push(CreateAccountFinalPage);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CreateAccountPage');
  }

  login(logType) {

    this.fb.loginAndroid().then(() => {
      this.fb.getCurrentUserProfileAndroid().then(
        (profileData) => {
          this.email = profileData.email;
          this.name = profileData.name;
          this.id = profileData.id;
          this.gender = profileData.gender;
          this.picture = "https://graph.facebook.com/" + profileData.id + "/picture?type=large";
      });
    });
  }

  logout() {
    
    this.fb.logoutAndroid();

  }

  showAlert(title,msg) {

      let alert = this.alertCtrl.create({
        title: msg,
        subTitle: msg,
        buttons: ['Dismiss']
      });
      alert.present();

  }

  // TODO:  Firebase email confirmation
  signupEmail() {

    if (this.emailForm.valid) {
      
       this.storage.ready().then(()=>{

         this.storage.set('user',this.emailForm.value.email);
         this.storage.set('userType','email');

         this.navCtrl.setRoot(MyPubPage);

       });       
    }
  }
}