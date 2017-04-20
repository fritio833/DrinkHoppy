import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';

import { SingletonService } from '../../providers/singleton-service';

@Component({
  selector: 'page-reviews',
  templateUrl: 'reviews.html'
})
export class ReviewsPage {

  public locationName:string;
  public reviews:any;

  constructor(public navCtrl: NavController, 
              public params: NavParams,
              public view:ViewController, 
              public sing:SingletonService) {
    this.reviews = params.get('reviews');
    this.locationName = params.get('locName');
    console.log('reviews',this.reviews)
  }

  cancel() {
    this.view.dismiss();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReviewsPage');
  }

}
