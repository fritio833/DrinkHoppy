import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { BreweryService } from '../../providers/brewery-service';

@Component({
  selector: 'page-festivals',
  templateUrl: 'festivals.html'
})
export class FestivalsPage {

  public festivals:any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public beerAPI: BreweryService) {}

  getFestivals() {
    this.beerAPI.getFestivals().subscribe(fest=>{
      console.log('fest',fest);
    },error=>{
      console.log('error',error);
    });
  }

  ionViewDidLoad() {
    this.getFestivals();
    console.log('ionViewDidLoad FestivalsPage');
  }

}
