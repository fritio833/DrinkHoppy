import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ModalController, LoadingController, PopoverController, ToastController, AlertController } from 'ionic-angular';
import { Geolocation } from 'ionic-native';
import { Ionic2RatingModule } from 'ionic2-rating';

import firebase from 'firebase';

import { GoogleService } from '../../providers/google-service';
import { BreweryService } from '../../providers/brewery-service';
import { SingletonService } from '../../providers/singleton-service';
import { ConnectivityService } from '../../providers/connectivity-service';

import { LocationDetailPage } from '../location-detail/location-detail';
import { BreweryDetailPage } from '../brewery-detail/brewery-detail';
import { SearchLocationKeyPage } from '../search-location-key/search-location-key';
import { SearchLocationFilterPage } from '../search-location-filter/search-location-filter';

declare var google;
declare var GoogleMap;

@Component({
  selector: 'page-search-location',
  templateUrl: 'search-location.html'
})
export class SearchLocationPage {

  @ViewChild('map') mapElement;
  public locations:any;
  public nextNearByToken:any;
  public predictions:any;
  public predictionsLen:number = 0;
  public showMap:boolean = false;
  public map:any;
  public mapInitialised: boolean = false;
  public apiKey: any = 'AIzaSyAKs0BGHgtV5I--IvIwsGkD3c_EFV0yXtY';
  public loading:any; 
  public markers:any;
  public filter:any;
  public geoLat:any;
  public geoLng:any;
  public infScroll:any;
  public placeType:any = null;
  public searchType:any;
  public fbRef:any;

  constructor(public navCtrl: NavController, 
  	          public params: NavParams,
  	          public toastCtrl:ToastController,
  	          public sing:SingletonService,
  	          public loadingCtrl:LoadingController,
              public alertCtrl:AlertController,
  	          public popCtrl:PopoverController,
  	          public conn:ConnectivityService,
              public modalCtrl:ModalController,
              public beerAPI:BreweryService, 
  	          public geo:GoogleService) {

    this.placeType = params.get('placeType');

    if (this.placeType == null)
      this.placeType = "all";

    this.searchType = params.get('searchType');
    this.fbRef = firebase.database();

  }

  doSearchLocation(evt) {
  	console.log(evt);
  }

  priceLevel(price) {
    let str = '';
    switch(price) {
      case 1: str = '$'; break;
      case 2: str = '$$'; break;
      case 3: str = '$$$'; break;
      case 4: str = '$$$$'; break;
      default: str = '';
    }
    return str;
  }

  fixPlaceType(placeType) {
    let pType = '';
    switch(placeType) {
      case 'bar': pType = 'Bars'; break;
      case 'convenience_store': pType = 'Convenience Stores'; break;
      case 'night_club': pType = 'Night Clubs'; break;
      case 'grocery_or_supermarket': pType = 'Grocery Stores'; break;
      case 'liquor_store': pType = 'Liquor Stores'; break;
      case 'restaurant': pType = 'Restaurants'; break;
      default: pType = placeType;
    }
    return pType;
  }

  fixLocations(locations) {

   let ptypes = '';
  
   for (var i = 0; i < locations.length; i++ ) {

      ptypes ='';
     
      if (this.sing.getLocation().geo) {

        let lat = parseFloat(locations[i].geometry.location.lat);
        let lng = parseFloat(locations[i].geometry.location.lng);
        let locPoint = {lat:lat,lng:lng};
        let userPoint = {lat:this.geoLat,lng:this.geoLng};
        let dist = this.geo.getDistance(locPoint,userPoint,true);
        locations[i]['distance'] = Math.round(dist * 10) / 10;
      }
      
      if (!locations[i].hasOwnProperty('opening_hours')) {
         locations[i]['opening_hours'] = {open_now:2};
      } else if (locations[i].opening_hours.open_now) {
        locations[i].opening_hours.open_now = 1;
      } else {
         locations[i].opening_hours.open_now = 0;
      }

      if (!locations[i].hasOwnProperty('vicinity') && locations[i].hasOwnProperty('formatted_address')) {
        locations[i]['vicinity'] = locations[i]['formatted_address'];  
      }

      locations[i]['vicinity'] = locations[i]['vicinity'].slice(0, locations[i]['vicinity'].indexOf(',')); 
    
      for (var j = 0; j < locations[i].types.length; j++) {
          
          if (locations[i].types[j] == 'bar'
              || locations[i].types[j] == 'night_club'
              || locations[i].types[j] == 'convenience_store'
              || locations[i].types[j] == 'gas_station'
              || locations[i].types[j] == 'liquor_store'
              || locations[i].types[j] == 'restaurant'
              || locations[i].types[j] == 'grocery_or_supermarket') {
            ptypes += locations[i].types[j] + ', ';
            break;
          }
      }
      locations[i].place_types = ptypes.replace(/,\s*$/, "").replace(/_/g, " ").replace(/\b[a-z]/g,function(f){return f.toUpperCase();});
    }
    //console.log(locations);
    return locations;
  }

  autoLocationSearch(event) {
        
  	if (event.type == "input") {

      if (this.sing.isOnline()) {
        setTimeout(()=>{
          console.log(event.target.value);
          this.geo.placesAutocomplete(event.target.value).subscribe((success)=>{
            this.predictions = success.predictions;
            this.predictionsLen = success.predictions.length;
            //console.log(this.predictions);
          },error=>{
            console.log('error placesAutocomplete',error);
          });
        },1000);
      } else {
        this.sing.showNetworkAlert();
      }
  	}
  }

  autoSearchCancel(event){
  	this.predictionsLen = 0;
  	this.predictions = new Array();
  }

  showLocalMap() {
  	this.showMap = true;

  	if (!this.mapInitialised)
  	  this.loadGoogleMaps();
  	else {
      this.clearMarkers();
  	  this.setLocationMarkers();
      this.setBounds();
    }
  }

  showLocalList() {
  	this.showMap = false;
  }

  getLocal() {

    if (this.sing.isOnline()) {
      this.showLoading();

      if (this.searchType == 'nearbysearch' || !this.sing.isSelectedLocation()) {
        Geolocation.getCurrentPosition().then((resp) => {

          this.geoLat = resp.coords.latitude;
          this.geoLng = resp.coords.longitude;
          this.setLocal(this.geoLat,this.geoLng);
          
        }).catch((error) => {
          this.sing.showNetworkAlert();
          this.loading.dismiss().catch(() => {});      
          console.log('Error getting geo location', error);
        });
      } else {
        // Selection based on city selected out of town
        this.setLocal(this.sing.selectLat,this.sing.selectLng);
      }
    } else {
      this.sing.showNetworkAlert();
    }
  }

  setLocal(lat,lng) {
      if (this.searchType == 'textsearch') {

           this.geo.reverseGeocodeLookup(lat,lng)
             .subscribe((success)=>{

              if (!this.sing.isSelectedLocation) {
                this.sing.geoCity = success.city;
                this.sing.geoState = success.state;
              }

              this.geo.searchByPlaceType(success.city+' '+success.state,this.placeType)
                .subscribe((locs)=>{
                  //console.log(success); 
                  this.locations = this.fixLocations(locs.results);
                  this.nextNearByToken = locs.next_page_token;
                  this.loading.dismiss().catch(() => {});
                },(error)=>{
                  console.log(error);
                  this.presentToast('Could not connect. Check connection.');
                  this.loading.dismiss().catch(() => {}); 
                  //console.log('Geolocation with high accuracy.');
                });
            },error=>{
              console.log('error geo.reverseGeocodeLookup',error);
              this.presentToast('Could not connect. Check connection.');
              this.loading.dismiss().catch(() => {});              
            });

      } else {

        this.geo.placesNearByRadius(lat,lng)
          .subscribe((success)=>{
             
             this.locations = this.fixLocations(success.results);
             this.nextNearByToken = success.next_page_token;             
             this.loading.dismiss().catch(() => {});
          },(error)=>{
            console.log('error geo.placesNearByRadius',error);
            this.presentToast('Could not connect. Check connection.');
            this.loading.dismiss().catch(() => {});
          });
      }
  }

  getMoreLocal(infiniteScroll) {
    if (this.sing.isOnline()) {
      if (this.nextNearByToken == null) {
        infiniteScroll.complete();
        return;
      }

      setTimeout(() => {

        this.geo.getNextToken(this.nextNearByToken,this.searchType).subscribe((success)=>{

          let locationsNext:any;

          locationsNext = this.fixLocations(success.results);

          if (success.hasOwnProperty('next_page_token'))
            this.nextNearByToken = success.next_page_token;

          for (let i = 0; i < locationsNext.length; i++) {
            this.locations.push(locationsNext[i]);
          }

          infiniteScroll.complete();

          
          if (!success.hasOwnProperty('next_page_token')) {
            //infiniteScroll.enable(false);
            this.nextNearByToken = null;
          }
        },error=>{
          this.presentToast('Could not connect. Check connection.');        
        });
      }, 1000);
    } else {
       this.presentToast('Could not connect. Check connection.');
      infiniteScroll.complete();
    }
  }

  getLocationDetail(location) {
    if (this.sing.isOnline()) {
      let validLocation = false;
      this.showLoading();
      this.geo.placeDetail(location.place_id).subscribe((resp)=>{

        this.isBrewery(resp.result).then(foundBrewery=>{
          //console.log('is brewery',status);
          
          if (!foundBrewery) {
            for (var i=0;i<resp.result.types.length;i++) {

              if (resp.result.types[i].match('night_club|food|bar|grocery_or_supermarket|liquor_store|gas_station|convenience_store')) {                
                  this.navCtrl.push(LocationDetailPage,{location:resp.result,loading:this.loading});
                  //this.loading.dismiss().catch(() => {});               
                  validLocation = true;
                  break;
              }
            }

            if (!validLocation) {
              console.log(resp.result.types);
              this.presentToast('Not a place that would sell alcoholic beverages');
              this.loading.dismiss().catch(() => {});
            }
          } else {
            this.getBreweryDetail(foundBrewery);
          }

        });   
      },error=>{
        console.log('error',error);
        this.loading.dismiss().catch(() => {});
        this.presentToast('Could not connect. Check connection.');
      });
    } else {
      this.sing.showNetworkAlert();
    }
  }

  getBreweryDetail(brewery) {
    //console.log('brewery',brewery);
    if (this.sing.isOnline()) {
      this.geo.placeDetail(brewery.placeId).subscribe((resp)=>{        
          this.beerAPI.getBreweryDetail(brewery.breweryId,brewery.breweryLocId).subscribe(pub=>{
            console.log('pub',pub);
            this.loading.dismiss();
            this.navCtrl.push(BreweryDetailPage,{brewery:pub['detail'],beers:pub['beers'],place:resp.result});        
          },error=>{
            console.log('error getBrewery',error);
            this.loading.dismiss().catch(() => {});
            this.presentToast('Could not connect. Check connection.');         
          });

      },error=>{
        console.log('error',error);
        this.loading.dismiss().catch(() => {});
        this.presentToast('Could not connect. Check connection.');
      });          
    } else {
      this.sing.showNetworkAlert();
    }
  }

  isBrewery(location) {
    return new Promise(resolve =>{

      this.fbRef.ref('brewery_google/'+location.place_id).once('value').then(snapshot=>{
        if (snapshot.exists()) {
          console.log('brewery found');
          resolve(snapshot.val());
        } else {
          resolve(false);
        }
      }).catch(error=>{
        console.log('error isBrewery',error);
      });     
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

  showLocationFilter() {
    if (this.sing.isOnline()){
      let modal = this.modalCtrl.create(SearchLocationFilterPage,
                                        { 
                                          filter:this.filter,
                                          placeType:this.placeType}
                                        );
      modal.onDidDismiss(filter => {
        //console.log('filter',filter);

        if (filter!=null) {
          this.showLoading();

          this.filter = filter;
          this.locations = [];

          if (this.searchType == 'textsearch' ) {

            this.placeType = this.filter.placeType;

            this.geo.searchByPlaceType(this.sing.getSelectCity()+' '+this.sing.getSelectState(),
                                        this.filter.placeType,
                                        this.filter).subscribe((resp)=>{
              this.locations = [];
              this.locations = this.fixLocations(resp.results);
              this.nextNearByToken = resp.next_page_token;
              //console.log('nextToken',this.nextNearByToken);
              if (this.showMap && this.markers.length) {
                  this.clearMarkers();
                  this.setLocationMarkers();
              }
              this.loading.dismiss().catch(() => {});
            },error=>{
              console.log('error',error);
              this.loading.dismiss().catch(() => {});
            });
          } else {
            this.geo.placesNearByRadius(this.geoLat,
                                        this.geoLng,
                                        this.filter.distance,
                                        this.filter).subscribe((resp)=>{
              this.locations = [];
              this.locations = this.fixLocations(resp.results);
              this.nextNearByToken = resp.next_page_token;
              //console.log('nextToken',this.nextNearByToken);
              if (this.showMap && this.markers.length) {
                  this.clearMarkers();
                  this.setLocationMarkers();
              }
              this.loading.dismiss().catch(() => {});
            },error=>{
              console.log('error',error);
              this.loading.dismiss().catch(() => {});            
            });
          }
        }

      });
      modal.present();
    } else {
      this.sing.showNetworkAlert();
    }
  }

  setBounds() {
    setTimeout(() => {
      google.maps.event.trigger(this.map, 'resize');
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < this.markers.length; i++) {
          bounds.extend(this.markers[i].getPosition());
        }
        this.map.fitBounds(bounds);

    }, 500);
  }

  initMap() {

    this.mapInitialised = true;

    let options = {timeout: 10000, enableHighAccuracy: false, maximumAge:3000};
    Geolocation.getCurrentPosition(options).then((resp) => {         

        let myLat = resp.coords.latitude;
        let myLng = resp.coords.longitude;
        this.setLocationMap(myLat,myLng)

	    this.loading.dismiss().catch(() => {});
        

    }).catch((error) => {
      this.loading.dismiss().catch(() => {});
      console.log('Error getting location');      
    });
  }

  clearMarkers() {
    for (var i = 0; i < this.markers.length; i++) {
      if (this.markers[i].title != "My Current Location")
        this.markers[i].setMap(null);
    }
    this.markers = [];
  }

  setLocationMarkers() {

    this.markers = [];//some array
    let records;
    let infowindow = new google.maps.InfoWindow();

    for (let i = 0; i < this.locations.length; i++) {

    	let lat = parseFloat(this.locations[i].geometry.location.lat);
    	let lng = parseFloat(this.locations[i].geometry.location.lng);
    	let locName = this.locations[i].name;
      let locLabel = String(i+1);
    	let latLng = new google.maps.LatLng(lat,lng);
     

      var marker = new google.maps.Marker({
          position: latLng,
          title: locName,
          label: locLabel,
          map: this.map
      });
      //marker.setMap(this.map);
      this.markers.push(marker);

      let temp = this;
	    google.maps.event.addListener(marker, 'click', (function(marker, i) {
	        return function() {
            temp.showInfoWindow(temp.locations[i]);
	        }
	    })(marker, i));	    
    }
    return this.markers;  	
  }

  setLocationMap(myLat,myLng) {

    this.markers = [];//some array
    let records; 
	  var im = 'images/icons/bluecircle.png'; 

    let mapOptions = {
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    this.map = new google.maps.Map(this.mapElement.nativeElement,mapOptions);
    this.markers = this.setLocationMarkers();

    let myLatLng = new google.maps.LatLng(myLat,myLng);

    if (!this.sing.isSelectedLocation()) {
      var userMarker = new google.maps.Marker({
          position: myLatLng,
          map: this.map,
          title: 'My Current Location',
          animation: google.maps.Animation.DROP,
          icon: im
      });

      this.markers.push(userMarker);    
    }
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < this.markers.length; i++) {
      bounds.extend(this.markers[i].getPosition());
    }
    this.map.fitBounds(bounds);
      
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

  showMarkerKey() {
  	let popover = this.popCtrl.create(SearchLocationKeyPage,{locations:this.locations});
  	popover.present();

    popover.onDidDismiss(success=>{
      //console.log(success);
      if (success!=null) {
        let lat = parseFloat(success.geometry.location.lat);
        let lng = parseFloat(success.geometry.location.lng);

        var laLatLng = new google.maps.LatLng(lat,lng);
        this.map.panTo(laLatLng);
        this.map.setZoom(18);
      }
    });
  }

  showInfoWindow(location) {
    let alert = this.alertCtrl.create({
      title: location.name,
      message: location.place_types,
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
            this.getLocationDetail(location);
          }
        }
      ]
    });
    alert.present();    
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

  ionViewDidLoad() {
    console.log('ionViewDidLoad SearchLocationPage');

    this.getLocal();
  }

}
