import { Component } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import firebase from 'firebase';

import { SingletonService } from '../../providers/singleton-service';

import { BeerDetailPage } from '../beer-detail/beer-detail';
import { AddBeerPage } from '../add-beer/add-beer';

@Component({
  selector: 'page-drink-menu',
  templateUrl: 'drink-menu.html'
})
export class DrinkMenuPage {

  public breweryBeers:any;
  public brewery:any;
  public locationName:any;
  public location:any;
  public isBrewery:boolean = false;
  public locationId:any;
  public locationBeerRef:any;
  public localBeers:FirebaseListObservable<any>;
  public fbRef:any;

  constructor(public navCtrl: NavController, 
              public params: NavParams,
              public sing: SingletonService,
              public modalCtrl:ModalController, 
              public angFire:AngularFire) {
    this.breweryBeers = params.get('beers');
    this.brewery = params.get('brewery');
    this.location = params.get('location');
    
    if (this.brewery) {
      this.locationName = this.brewery.brewery.name;
      this.isBrewery = true;
    } else if (this.location) {
      this.locationName = this.location.name;
    }

    if (this.breweryBeers == null) {
      this.breweryBeers = new Array();
    }    
 
    //console.log('brewery',this.brewery);
    console.log('beers',this.breweryBeers);
  }

  getBeerDetail(beerId) {
  	this.navCtrl.push(BeerDetailPage,{beerId:beerId});

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DrinkMenuPage');

    if (this.location) {
      this.locationId = this.location.place_id;
      this.localBeers = this.angFire.database.list('/location_menu/'+this.locationId+'/beers',{
        query: {
          orderByChild: 'name'
        }
      });
    }

  }

  timeDiff(previous) {
    return this.sing.timeDifference( new Date().getTime(),previous,true);
  }

  addBeer() {
    let modal = this.modalCtrl.create(AddBeerPage,
                                      { breweryId:this.brewery.breweryId,
                                        locName:this.brewery.brewery.name
                                      });
    modal.present();
  }  

}
