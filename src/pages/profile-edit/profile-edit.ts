import { Component } from '@angular/core';
import { NavController, AlertController, ModalController, ToastController, NavParams, ActionSheetController, LoadingController, ViewController } from 'ionic-angular';
import { Validators, FormBuilder } from '@angular/forms';
import { Camera } from 'ionic-native';
import { AuthService } from '../../providers/auth-service';
import { ValidationService } from '../../providers/validation-service';
import { GoogleService } from '../../providers/google-service';
import { SingletonService } from '../../providers/singleton-service';

import { SelectLocationPage } from '../select-location/select-location';

import firebase from 'firebase';

@Component({
  selector: 'page-profile-edit',
  templateUrl: 'profile-edit.html'
})
export class ProfileEditPage {

  public uid:any;
  public profileForm:any;
  public profileRef:any;
  public profileIMG:string = 'images/default-profile.png';
  public displayName:string;
  public loading:any;
  public imageToUpload:string;
  public userRef:any;
  public profilePicSeqRef:any;
  public profilePictureRef: firebase.storage.Reference;
  public deleteProPictureRef: firebase.storage.Reference;
  public percentIMGLoaded:number;
  public hometownLocation:string;
  public userLocation:any;
  public oldCity:string;
  public oldState:string;
  public profileChangedCount:number = 0;

  constructor(public navCtrl: NavController, 
              public view: ViewController,
              public form: FormBuilder,
              public auth: AuthService,
              public alertCtrl: AlertController,
              public loadingCtrl:LoadingController,
              public toastCtrl:ToastController,
              public modalCtrl: ModalController,
              public geo:GoogleService,
              public sing:SingletonService,
              public actionCtrl:ActionSheetController,
              public params: NavParams) {

  	this.uid = params.get('uid');
  	this.profileForm = this.form.group({
  	  email : ['',Validators.compose([Validators.required, 
  	              Validators.maxLength(30),
  	              ValidationService.emailValidator])],                 
  	  name : ['',Validators.compose([Validators.required,
  	                  Validators.pattern('[a-zA-Z ]*'),Validators.maxLength(30)])]
  	});
    this.profilePictureRef = firebase.storage().ref('/profiles/');
    this.deleteProPictureRef = firebase.storage().ref('/profiles/');
    this.profilePicSeqRef = firebase.database().ref('/sequences/profileIMG/');
    this.userRef = firebase.database();
    this.loadProfileData();
  }

  loadProfileData() {
    this.showLoading();
    this.profileRef = firebase.database().ref('users/'+this.uid).once('value').then(snapshot => {
      this.displayName = snapshot.val().name;
      if (snapshot.val().photo!=null && snapshot.val().photo !='') {
        this.profileIMG = snapshot.val().photo;
      }

      if (snapshot.val().city!=null) {
        this.hometownLocation = snapshot.val().city + ', '+snapshot.val().state+' '+snapshot.val().country;
        this.oldCity = snapshot.val().city;
        this.oldState = snapshot.val().state;
      }
      
    this.profileForm.setValue({
      name:snapshot.val().name, 
      email:snapshot.val().email
    });      
      this.loading.dismiss();
    });
  }

  close() {
  	this.view.dismiss();
  }

  changeCity() {

    let modal = this.modalCtrl.create(SelectLocationPage,{response:true});
    modal.onDidDismiss(citySet => {
      console.log('cityState',citySet);
      
      if (citySet) {
        this.userLocation = this.geo.fixCityState(citySet);
        this.hometownLocation = this.userLocation.city + ', '+this.userLocation.state+' '+this.userLocation.country; 
      }
      
    });
    modal.present();

  }

  getImgSeqDirectory() {

    let sub = this.uid.substring(this.uid.length - 4,this.uid.length);
    let img = this.uid+'.png';
    return {sub:sub,img:img};
    
  }

  saveProfile() {

    if (this.profileForm.valid) {

      let user = this.auth.getUser();
      if (this.profileForm.controls.name.value.toUpperCase() !== this.displayName.toUpperCase()) {
        let updateName = {
                           name:this.profileForm.controls.name.value,
                           nameLower:this.profileForm.controls.name.value.toLowerCase()
                        };
        this.userRef.ref('users/' + this.uid).update(updateName);

        user.updateProfile({
          displayName: this.profileForm.controls.name.value
        }).then(function() {
          // Update successful.
        }, function(error) {
          // An error happened.
        });        
        this.profileChangedCount++;

      }

      if (this.userLocation!=null) {

        let locKey =  this.sing.getCityStateKey(this.userLocation.city,this.userLocation.state,this.userLocation.country);

        let updateLocation = {
          city:this.userLocation.city,
          state:this.userLocation.state,
          country:this.userLocation.country,
          locationKey:locKey
        }

        this.profileChangedCount++;
        this.userRef.ref('users/' + this.uid).update(updateLocation).then(value=>{
          console.log('profileChanged success');
        }).catch(error=>{
          console.log('error profileChanged',error);
        });
        
      }      

      if (user.email.toUpperCase() !== this.profileForm.controls.email.value.toUpperCase()) {
        this.reauthEmail();
      } else {
        if (this.profileChangedCount)
          this.presentToast('Profile has been changed');

        this.view.dismiss();
      }
    }
  }

  changeEmail(password) {
    let user = this.auth.getUser();
    let credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    console.log('cred',credential);
    
    user.reauthenticate(credential).then(success=> {
      user.updateEmail(this.profileForm.controls.email.value).then(resp=>{
        console.log('resp',resp);
        user.sendEmailVerification();
        let updateEmail = {email:this.profileForm.controls.email.value};
        this.userRef.ref('users/' + this.uid).update(updateEmail);

        if (this.profileChangedCount)
          this.presentToast('Profile has been changed');
        else
         this.presentToast('Email has been changed');

        this.view.dismiss();    
      }).catch(error=>{
        this.presentToast(error.message);
        console.log('error updateEmail',error);
      });
      
    }, error=> {
      console.log('error',error);
      this.presentToast(error.message);
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

  takePicture(sourceType) {
    this.showLoading();
    var options = {
      quality: 90,
      targetWidth: 100,
      targetHeight: 100,
      allowEdit: true,
      encodingType: Camera.EncodingType.PNG,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };
   
    Camera.getPicture(options).then((imageData) => {
      // imageData is a base64 encoded string
        this.profileIMG = "data:image/png;base64," + imageData;
        this.imageToUpload = imageData;
        let user = this.auth.getUser();

        if (this.profileIMG != null) {

          let subDir = this.getImgSeqDirectory();

          this.profilePictureRef.child(subDir.sub).child(subDir.img)
            .putString(this.imageToUpload,'base64',{contentType:'image/png'})
            .then(resp=>{
            
            let photoURL = {photo:resp.downloadURL};
            this.userRef.ref('users/' + this.uid).update(photoURL);

            user.updateProfile({
              photoURL: resp.downloadURL
            }).then(resp=> {
              // Update successful.
              console.log('resp',resp);
            }, function(error) {
              // An error happened.
              console.log('error',error);
            });

            this.presentToast("Avatar has been changed");
            this.loading.dismiss(); 
          });

        }
    }, (err) => {
        console.log(err);
        this.loading.dismiss();
    });
  }

  reauthEmail() {
    let prompt = this.alertCtrl.create({
      title: 'Reauthenticate Email',
      message: "Enter email password to change",
      inputs: [
        {
          name: 'password',
          placeholder:'Password',
          type: 'password'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Change',
          handler: data => {
            //console.log('Saved clicked');
            this.changeEmail(data.password);
          }
        }
      ]
    });
    prompt.present();
  }

  changeProfileImg() {
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

  showLoadingImg() {
    this.loading = this.loadingCtrl.create({
      content: 'Loading...'
    });
    this.loading.present();    
  }
  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Loading...'
    });
    this.loading.present();
  }   

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProfileEditPage');
  }

}
