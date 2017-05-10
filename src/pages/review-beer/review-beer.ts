import { Component} from '@angular/core';
import { NavController, ViewController, NavParams, ToastController } from 'ionic-angular';
import { Ionic2RatingModule } from 'ionic2-rating';

import { Storage } from '@ionic/storage';

/*
  Generated class for the ReviewBeer page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-review-beer',
  templateUrl: 'review-beer.html'
})

export class ReviewBeerPage {

  public BeerId:any;
  public BeerName:any;
  public beerRating = 0;
  public beerReview = '';
  public beerPic = '';

  constructor(public navCtrl: NavController, 
              public params: NavParams, 
              public view: ViewController, 
              public storage:Storage, 
              public toastCtrl:ToastController) {

     this.BeerId = params.get('beerId');
     this.BeerName = params.get('beerName');
     this.beerPic = params.get('beerPic');

     //console.log('BeerId', this.BeerId);
  }
  

  cancel() {
    this.view.dismiss();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReviewBeerPage');
  }

  submitBeerReview() {

  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }   

}
