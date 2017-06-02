import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, ToastController, ModalController } from 'ionic-angular';
import { Validators, FormBuilder } from '@angular/forms';

import { BreweryService } from '../../providers/brewery-service';
import { SingletonService } from '../../providers/singleton-service';
import { Beer } from '../../models/beer';
import { SearchPage } from '../search/search';
import { BeerDetailPage } from '../beer-detail/beer-detail';
import { SearchBeerFilterPage } from '../search-beer-filter/search-beer-filter';

@Component({
  selector: 'page-search-beer',
  templateUrl: 'search-beer.html'
})
export class SearchBeerPage {

  public qSearchBeer:string = '';
  public alert:string;
  public beers:Beer[] =  new Array();
  public totalResults:number = 0;
  public numberOfPages:number;
  public currentPage:number;
  public popularBeers:any;
  public filter:any;
  public showLoader:boolean = false;
  public showNoResults:boolean = false;
  public loading:any;

  constructor(public navCtrl: NavController, 
  	          public params: NavParams,
  	          public beerAPI: BreweryService,
  	          public toastCtrl: ToastController,
  	          public modalCtrl:ModalController,
              public sing: SingletonService,
              public loadingCtrl:LoadingController,
  	          public _form: FormBuilder) {

  	this.qSearchBeer = params.get("qSearchBeer");
  	this.alert = params.get("alert");
    this.currentPage = 1;
  }

  loadBeers(data) {
    // console.log(data);
    this.beers = this.fixBeers(data.data);
    this.totalResults = data.totalResults;
  }


  fixBeers(beers) {

    for (var i=0;i<beers.length;i++) {

      if (!beers[i].hasOwnProperty('breweries')) {
        beers[i]['breweries'] = new Array({name:''}); // fix beers without breweries
      }

      // fix beers with no images
      if (!beers[i].hasOwnProperty('labels')) {
        beers[i]['labels'] = {icon:'images/no-image.jpg',medium:'images/no-image.jpg',large:'images/no-image.jpg'};
      }
    }
    return beers;
  }  

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }
  
  clearSearch(event){

    this.showNoResults = false;
  	this.qSearchBeer = '';
    this.totalResults = 0;
    this.showLoader = false;
  	this.beers = null;
  }
  doSearchBeer(evt) {
    
    this.qSearchBeer = '';
    if (evt.type != "input")
      return;

    if (this.sing.online) {
      this.showNoResults = false;
      this.currentPage = 1;

      if (evt.target.value.length > 2) {
        this.showLoading();
        this.beerAPI.findBeerByName(evt.target.value).subscribe(beer => {
            console.log('searchReturn',beer);
            this.beers = beer;
            this.numberOfPages = beer.numberOfPages;
            
            if (this.beers.hasOwnProperty('totalResults'))
              this.totalResults = beer.totalResults;
            else {
              this.totalResults = 0;
              this.showNoResults = true;
            }
            //console.log(this.beers);
            this.qSearchBeer = evt.target.value;
            if (this.totalResults)
              this.beers = beer.data;
            
            console.log('beers1',this.beers);
            this.loading.dismiss();          
        },error=>{
          console.log('error',error);
          this.loading.dismiss().catch(() => {});
          this.showNoResults = false;
          this.presentToast('Could not connect. Check connection.');
        });
      } else {
        this.totalResults = 0;
        this.showLoader = false;
      }
    } else {
      this.sing.showNetworkAlert();
    }
  }

  getMoreBeers(infiniteScroll) {
    
    if (this.sing.online) {
      if (this.currentPage < this.numberOfPages) {
        this.currentPage++;
      }

      setTimeout(() => {
        this.beerAPI.loadBeerByName(this.qSearchBeer,this.currentPage,this.filter).subscribe((beer)=>{
          let beersNext:any;

          beersNext = beer.data;

          for (var i = 0; i < beersNext.length; i++) {
            this.beers.push(beersNext[i]);
          }
          //console.log(beersNext);
          infiniteScroll.complete();

          if (this.currentPage == this.numberOfPages)
            infiniteScroll.enable(false);

        },error=>{
          //this.presentToast('Could not connect. Check connection.');
          this.sing.showNetworkAlert();
        });
      }, 1000);
    } else {
      infiniteScroll.complete();
      this.presentToast('Could not connect. Check connection.');
      //this.sing.showNetworkAlert();
    }
  }

  showBeerFilter() {
    if (this.sing.online) {
      this.showNoResults = false;
      let modal = this.modalCtrl.create(SearchBeerFilterPage,{filter:this.filter});
      modal.onDidDismiss(filter => {

        if (filter == null)
          return;
        //console.log('filter',filter);      
        if (filter.styleId != null || 
            filter.categoryId != null ||
            filter.minABV != null ||
            filter.minIBU != null ||
            filter.showLabels != null ||
            filter.isOrganic != null) {
          this.filter = filter;
          this.showLoading();
          this.qSearchBeer = '';
          this.clearSearch(null);
          this.beerAPI.loadBeerByName(this.qSearchBeer,this.currentPage,this.filter).subscribe(beer => {
              if (beer.hasOwnProperty('data')) { 
                this.beers = beer.data;
                this.numberOfPages = beer.numberOfPages;
                this.totalResults = beer.totalResults;
                //console.log(this.beers);
                //this.loadBeers(this.beers);
              } else {
                this.beers = new Array();
                this.presentToast("Sorry. No beers found.")
              }
              this.loading.dismiss();
          },error=>{
            this.loading.dismiss().catch(() => {});
            this.sing.showNetworkAlert();
          });
        }
      });
      modal.present();
    } else {
      this.sing.showNetworkAlert();
    }
  }

  getBeerDetail(beerDbId) {
    if (this.sing.online)
      this.navCtrl.push(BeerDetailPage,{beerId:beerDbId});
    else
      this.sing.showNetworkAlert();
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({});
    this.loading.present();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SearchBeerPage');
  }

}
