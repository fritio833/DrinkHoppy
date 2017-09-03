import { Component, ViewChild } from '@angular/core';
import { NavController, LoadingController, ToastController, PopoverController, AlertController, NavParams, ModalController } from 'ionic-angular';
import { Geolocation } from 'ionic-native';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import { BreweryService } from '../../providers/brewery-service';
import { SingletonService } from '../../providers/singleton-service';
import { GoogleService } from '../../providers/google-service';
import { ConnectivityService } from '../../providers/connectivity-service';

import { BreweryDetailPage } from '../brewery-detail/brewery-detail';
import { SelectLocationPage } from '../select-location/select-location';
import { SearchLocationKeyPage } from '../search-location-key/search-location-key';
import { AddBreweryPage } from '../add-brewery/add-brewery';

declare var google;
declare var GoogleMap;

@Component({
  selector: 'page-search-breweries',
  templateUrl: 'search-breweries.html'
})
export class SearchBreweriesPage {

  @ViewChild('map') mapElement;
  public breweries = new Array();
  public brewerySearch:any;
  public brewerySearchLen:number = -1;
  public numPages:number;
  public showMap:boolean = false;
  public map:any;
  public loading:any;
  public mapInitialised: boolean = false;
  public apiKey: any = 'AIzaSyAKs0BGHgtV5I--IvIwsGkD3c_EFV0yXtY';  
  public city:string;
  public markers:any;
  public qBreweryAuto:string = "";
  public breweriesFound:number = -1;

  constructor(public navCtrl: NavController, 
  	          public navParams: NavParams,
  	          public sing: SingletonService,
  	          public geo: GoogleService,
  	          public loadingCtrl:LoadingController,
  	          public modalCtrl: ModalController,
  	          public alertCtrl:AlertController,
  	          public popCtrl:PopoverController,
  	          public conn:ConnectivityService,
              public toastCtrl: ToastController,
  	          public beerAPI:BreweryService) {}

  getMoreBreweries(evt) {
  	console.log('evt',evt);
  }

  changeCity() {

    let modal = this.modalCtrl.create(SelectLocationPage);
    modal.onDidDismiss(citySet => {
      // console.log('filter',filter);
      if (citySet) {
      	this.getBreweries();
      	//this.mapInitialised = false;
      }
    });
    modal.present();

  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }


  autoSearchCancel(event){
    this.brewerySearch = [];
    this.brewerySearchLen = 0;
    this.qBreweryAuto = '';
    //console.log('i got here');
  }


  getDetail(brewery) {
    console.log(brewery);
    let breweryId;
    let foundBrewpub:number = -1;
  
    if (this.sing.isOnline()) {
  
      this.showLoading();

      this.geo.getPlaceFromGoogleByLatLng(brewery.name,brewery.latitude,brewery.longitude).subscribe(resp=>{
      
        this.beerAPI.getBreweryDetail(brewery.breweryId,brewery.id).subscribe(pub=>{
          //console.log('pub',pub);
          this.loading.dismiss();
          this.navCtrl.push(BreweryDetailPage,{brewery:pub['detail'],beers:pub['beers'],place:resp['result']});        
        },error=>{
          console.log('error getBrewery',error);
          this.loading.dismiss().catch(() => {});
          //this.presentToast('Could not connect. Check connection.');
          this.sing.showNetworkAlert();         
        });

      },error=>{
          console.log('error getBreweryFromGoogle',error);
          this.loading.dismiss().catch(() => {});
          //this.presentToast('Could not connect. Check connection.');
          this.sing.showNetworkAlert();      
      });
    } else {
      this.sing.showNetworkAlert();
    }
        
  }

  fixBreweries(breweries) {

    for (var i=0;i<breweries.length;i++) {

      // fix beers with no images
      if (!breweries[i]['brewery'].hasOwnProperty('images')) {
        breweries[i]['brewery']['images'] = {icon:null,
                                             medium:null,
                                             squareMedium:null, 
                                             large:null};
      }
      breweries[i].name = breweries[i].brewery.name; 
    }
    return breweries;
  } 

  autoBrewerySearch(event) {

    
  	if (event.type == "input" && event.target.value.length) {
        this.qBreweryAuto = event.target.value;
        console.log('i got here 3');
  	    this.beerAPI.findBreweriesByName(event.target.value).subscribe((success)=>{
  	      console.log('brewery',success);
          let observableBatch = [];
  	      if (success.hasOwnProperty('data')) {
	  	      let brewSearch = success.data;
            this.brewerySearch = [];
            for (let i=0; i < brewSearch.length; i++) {
              observableBatch.push(this.beerAPI.loadBreweryLocations(brewSearch[i].id));
            }

            Observable.forkJoin(observableBatch).subscribe(pubs=>{
              console.log('pubs',pubs);
              for (let i = 0; i < pubs.length; i++) {
                let pub = pubs[i]['data'];
                console.log('bs',brewSearch[i]);
                console.log('pub',pub);
                for (let j = 0; j < pub.length; j++) {
                  let pubObj = {};
                  pubObj['img'] = '';
                  pubObj['breweryId'] = brewSearch[i].id;
                  pubObj['id'] = pub[j].id;
                  pubObj['name'] = brewSearch[i].name;
                  pubObj['locationTypeDisplay'] = pub[j].locationTypeDisplay;
                  pubObj['latitude'] = pub[j].latitude;
                  pubObj['longitude'] = pub[j].longitude;

                  if (brewSearch[i].hasOwnProperty('images')) {
                    pubObj['img'] = brewSearch[i].images.icon;
                  }
                  this.brewerySearch.push(pubObj);
                }
              }
              this.brewerySearchLen = this.brewerySearch.length;
               this.breweriesFound = 1;
            });            
	  	        	      	
  	      } else {
	  	      this.brewerySearch = new Array();
	  	      this.brewerySearchLen = 0;
            this.breweriesFound = 0;	      	
  	      }

          //this.beerAPI.loadBreweryLocations()


        },error=>{
          console.log('error findBreweriesByName',error);
          //this.presentToast('Could not connect. Check connection.');
          this.sing.showNetworkAlert();
        });
  	} else {
  	    this.brewerySearch = new Array();
  	    this.brewerySearchLen = 0;
  	}
  }

  getBreweries() {

    if (this.sing.isOnline()) {
      this.showLoading();
      // Get breweries at user's current location
      if (this.sing.getLocation().geo != null && this.sing.getLocation().geo){

        let options = {timeout: 5000, enableHighAccuracy: true, maximumAge:3000};
        Geolocation.getCurrentPosition(options).then((resp) => {          

          this.beerAPI.findBreweriesByGeo(resp.coords.latitude,resp.coords.longitude)
          .subscribe((breweries)=>{
            //console.log(breweries);          
            if (breweries.hasOwnProperty('data')) {
              this.breweries = this.fixBreweries(breweries.data);
              console.log('breweries',this.breweries);
              this.numPages = breweries.numberOfPages;            
            } else {
              this.breweries = new Array();
              this.numPages = 0;
              this.showNoBreweries();
            }
            this.loading.dismiss();    
          },error=>{
            this.loading.dismiss().catch(() => {});
            this.sing.showNetworkAlert();
          });

        }).catch((error) => {
            console.log('Error getting location using high accuracy', error);
            this.loading.dismiss().catch(() => {});
        });
      } else if (this.sing.getLocation().geo != null && !this.sing.getLocation().geo) { // breweries from user's selected city
          this.beerAPI.findBreweriesByGeo(this.sing.getLocation().lat,this.sing.getLocation().lng)
          .subscribe((breweries)=>{
            //console.log('cityBrew',breweries);
            if (breweries.hasOwnProperty('data')) {
              this.breweries = this.fixBreweries(breweries.data);
              this.numPages = breweries.numberOfPages;
               this.breweriesFound = 1;            
            } else {
              this.breweries = new Array();
              this.numPages = 0;
               this.breweriesFound = 0;
               console.log('i got here');
              //this.showNoBreweries();
            }
            this.loading.dismiss();       
          },error=>{
            this.loading.dismiss().catch(() => {});
            this.sing.showNetworkAlert();        
          });    	
      } else {
        this.presentToast('Failed to get location.');
        this.loading.dismiss().catch(() => {});
      }
    } else {
      this.sing.showNetworkAlert();
    }
  }

  clearMarkers() {
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(null);
    }
    this.markers = [];
  }  

  showBreweryMap() {
  	this.showMap = true;

  	if (!this.mapInitialised)
  	  this.loadGoogleMaps();
  	else {
  	  this.setLocationMarkers();
  	  this.setMapBounds();
  	}
  }

  showBreweryList() {
  	this.showMap = false;
  }  

  initMap() {

    this.mapInitialised = true;
    this.setLocationMap();
	  this.loading.dismiss();       
       
  }

  showMarkerKey() { 
  	let popover = this.popCtrl.create(SearchLocationKeyPage,{locations:this.breweries});
  	popover.present();

    popover.onDidDismiss(success=>{
      //console.log(success);
      if (success!=null) {
        let lat = parseFloat(success.latitude);
        let lng = parseFloat(success.longitude);

        var laLatLng = new google.maps.LatLng(lat,lng);
        this.map.panTo(laLatLng);
        this.map.setZoom(18);
      }
    });
  }

  setMapBounds() {
  	setTimeout(() => {
  		google.maps.event.trigger(this.map, 'resize');
  	    var bounds = new google.maps.LatLngBounds();
  	    for (var i = 0; i < this.markers.length; i++) {
  	      bounds.extend(this.markers[i].getPosition());
  	    }
  	    this.map.fitBounds(bounds);

  	}, 500);
  }

  setLocationMap() {

    this.markers = [];//some array
    let records; 

    let mapOptions = {
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    this.map = new google.maps.Map(this.mapElement.nativeElement,mapOptions);
    this.markers = this.setLocationMarkers();

    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < this.markers.length; i++) {
      bounds.extend(this.markers[i].getPosition());
    }


	  setTimeout(() => {
		  google.maps.event.trigger(this.map, 'resize');
	      this.map.fitBounds(bounds);
	  }, 500);    
   
  }

  setLocationMarkers() {
  	this.clearMarkers();
    let myLatLng:any;
    let im = 'images/icons/bluecircle.png';     
    //this.markers = [];//some array
    let records;
    let infowindow = new google.maps.InfoWindow();

    for (var i = 0; i < this.breweries.length; i++) {

	  let lat = parseFloat(this.breweries[i].latitude);
	  let lng = parseFloat(this.breweries[i].longitude);
      myLatLng = new google.maps.LatLng(lat,lng);
      let locLabel = String(i+1);

      var marker = new google.maps.Marker({
          position: myLatLng,
          title: this.breweries[i].brewery.name,
          label: locLabel,
          map: this.map
      });
      //marker.setMap(this.map);
      this.markers.push(marker);

      let temp = this;
	    google.maps.event.addListener(marker, 'click', (function(marker, i) {
	        return function() {
            temp.showInfoWindow(temp.breweries[i]);
	        }
	    })(marker, i));      

    }

    if (!this.sing.isSelectedLocation()) {
      console.log('lat lng',this.sing.geoLat + ' - ' + this.sing.geoLng);
      myLatLng = new google.maps.LatLng(this.sing.geoLat,this.sing.geoLng);

      var userMarker = new google.maps.Marker({
          position: myLatLng,
          map: this.map,
          title: 'My Current Location',
          animation: google.maps.Animation.DROP,
          icon: im
      });
      this.markers.push(userMarker);      
    }    
    return this.markers;  	
  }  

  loadGoogleMaps() {
    this.showLoading();
    this.addConnectivityListeners();
 
    if (typeof google == "undefined" || typeof google.maps == "undefined" ) {
 
	    console.log("Google maps JavaScript needs to be loaded.");
	    this.disableMap();
	 
	    if(this.sing.isOnline()){
	      console.log("online, loading map");
	 
	      //Load the SDK
	      window['mapInit'] = () => {
	        this.initMap();
	        this.enableMap();
	      }
	 
	      let script = document.createElement("script");
	      script.id = "googleMaps";
	 
	      if(this.apiKey){
	        script.src = 'http://maps.google.com/maps/api/js?key=' + this.apiKey + '&callback=mapInit';
	      } else {
	        script.src = 'http://maps.google.com/maps/api/js?callback=mapInit';       
	      }
	 
	      document.body.appendChild(script);  
	 
	    } 
    } else {
 
	    if(this.sing.isOnline()){
	      console.log("showing map");
	      this.initMap();
	      this.enableMap();
	    }
	    else {
	      console.log("disabling map");
	      this.disableMap();
	    }
    }
  }

  addConnectivityListeners(){
 
    let onOnline = () => {
 
      setTimeout(() => {
        if(typeof google == "undefined" || typeof google.maps == "undefined"){
 
          this.loadGoogleMaps();
 
        } else {
 
          if(!this.mapInitialised){
            this.initMap();
          }
 
          this.enableMap();
        }
      }, 2000);
 
    };
 
    let onOffline = () => {
      this.disableMap();
    };
 
    document.addEventListener('online', onOnline, false);
    document.addEventListener('offline', onOffline, false);
 
  }

  disableMap(){
    console.log("disable map");
  }
 
  enableMap(){
    console.log("enable map");
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({});
    this.loading.present();
  }

  showNoBreweries() {
    let alert = this.alertCtrl.create({
      title: 'Sorry',
      message: 'No breweries located in '+this.sing.getSelectCity()+'.  If the brewery does exist, please tell us about it.',
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Submit Brewery',
          handler: () => {
            //this.getDetail(brewery);
          }
        }
      ]
    });
    alert.present();    
  }   

  showInfoWindow(brewery) {
    let message = '';

    if (brewery.brewery.images.icon!=null)
      message = '<div align="center"><img src="' + brewery.brewery.images.icon + '"/></div>';

    let alert = this.alertCtrl.create({
      title: brewery.brewery.name,
      message: message,
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'View Detail',
          handler: () => {
            this.getDetail(brewery);
          }
        }
      ]
    });
    alert.present();    
  }

  addBrewery() {
    let modal = this.modalCtrl.create(AddBreweryPage,{breweryName:this.qBreweryAuto});
    modal.present();      
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SearchBreweriesPage');
    this.getBreweries();
    
  }

}
