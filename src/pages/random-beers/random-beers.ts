import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';

import { BreweryService } from '../../providers/brewery-service';

import { BeerDetailPage } from '../beer-detail/beer-detail';

@Component({
  selector: 'page-random-beers',
  templateUrl: 'random-beers.html'
})
export class RandomBeersPage {

  public beers:any;
  public randomBeers = new Array();
  public numberOfPages:number = 0;
  public currentPage:number = 0;
  public totalResults:number = 0;


  constructor(public navCtrl: NavController, public params: NavParams, public beerAPI:BreweryService, public loadCtrl:LoadingController) {
    this.beers = params.get('beers');

    if (params.get('loading')!=null) {
      params.get('loading').dismiss();
    }    
  }

  getRandomBeers() {
    
    if (this.beers.hasOwnProperty('totalResults')) {
      this.currentPage = this.beers.currentPage;
      this.numberOfPages = this.beers.numberOfPages;
      this.totalResults = this.beers.totalResults;
      
      if (this.totalResults) {
        this.randomBeers = this.beers.data;
        console.log('beers',this.beers);
      }
    }
  }

  getMoreBeers(infiniteScroll) {

    if (this.currentPage < this.numberOfPages) {
      this.currentPage++;
    }
   
    setTimeout(() => {
      this.beerAPI.getRandomBeers(this.currentPage).subscribe((beer)=>{
        let beersNext:any;

        let randBeer = beer.data;
        for (var i = 0; i < randBeer.length; i++) {
          this.randomBeers.push(randBeer[i]);
        }
        //console.log(beersNext);
        infiniteScroll.complete();

        if (this.currentPage == this.numberOfPages)
          infiniteScroll.enable(false);

      },error=>{
         //this.presentToast('Could not connect. Check connection.');
         alert('Could not connect. Check connection.');
      });
    }, 1000);
  }

  getBeerDetail(beerDbId) {
    this.navCtrl.push(BeerDetailPage,{beerId:beerDbId});
  }
 
  ionViewDidLoad() {
    console.log('ionViewDidLoad RandomBeersPage');
    this.getRandomBeers();
  }

}
