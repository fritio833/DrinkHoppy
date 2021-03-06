import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';

import { GoogleService } from '../../providers/google-service';
import { SingletonService } from '../../providers/singleton-service';


@Component({
  selector: 'page-select-location',
  templateUrl: 'select-location.html'
})
export class SelectLocationPage {

  public autocompleteItems = [];
  public citiesPredictions;
  public getResponse:boolean = false;
  
  constructor(public navCtrl: NavController, 
  	          public params: NavParams,
  	          public geo: GoogleService,
  	          public sing: SingletonService,
  	          public view: ViewController) {
    this.getResponse = params.get('response');
  }

  cancel() {
    this.view.dismiss(false);
  }  

  autoLocationSearch(event) {
  	if (event.type == "input") {
  	  this.geo.cityAutoComplete(event.target.value).subscribe((success)=>{  	  	
  	  	this.citiesPredictions = success.predictions;
  	  	console.log(this.citiesPredictions);
      },error=>{
        console.log('error',error);
      }); 
  	}
  }

  selectCity(city) {
  	//console.log('city',city);
  	this.geo.placeDetail(city.place_id).subscribe((success)=>{
      // console.log('resp',success);  
  		let cityState = this.geo.fixCityState(success);
  		this.sing.selectCity = cityState.city;
  		this.sing.selectState = cityState.state;
      this.sing.selectCountry = cityState.country;
  		this.sing.selectLat = success.result.geometry.location.lat;
  		this.sing.selectLng = success.result.geometry.location.lng;

      if (this.getResponse)
        this.view.dismiss(success);
      else
  		  this.view.dismiss(true);
        
  	},error=>{
      console.log('error',error);
    });
  }

  setCurrentLocation() {
    this.sing.setLocationToGeo();
    this.view.dismiss(true);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SelectLocationPage');
  }

}
