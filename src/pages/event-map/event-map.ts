import { Component } from '@angular/core';
import { PhotoViewer } from '@ionic-native/photo-viewer';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import { NavController, NavParams, ToastController, LoadingController,  ActionSheetController, ModalController } from 'ionic-angular';

import firebase from 'firebase';

import { BreweryService } from '../../providers/brewery-service';
import { GoogleService } from '../../providers/google-service';
import { AuthService } from '../../providers/auth-service';
import { SingletonService } from '../../providers/singleton-service';
import { ConnectivityService } from '../../providers/connectivity-service';

import { BeerDetailPage } from '../beer-detail/beer-detail';
import { BreweryDetailPage } from '../brewery-detail/brewery-detail';
import { EventBreweryBeersPage } from '../event-brewery-beers/event-brewery-beers';



@Component({
  selector: 'page-event-map',
  templateUrl: 'event-map.html'
})


export class EventMapPage {
  public choice = 'breweries';
  public eventBeers = new Array();
  public loading:any;
  public fbRef:any;
  public user:any;
  public approve = new Array();
  public groupedBeers = [];
  public groupedVendors = [];
  public isGrouped:boolean = false;
  public eventId:string;
  public event:any;
  public eventBreweries = [];
  public eventBooths = {};
  public showEvent:boolean = false;
  public eventVendors = {};

  constructor(public navCtrl:NavController, 
              public navParams:NavParams,
              public beerAPI: BreweryService,
              public geo:GoogleService,
              public loadingCtrl:LoadingController,
              public modalCtrl:ModalController,
              public auth:AuthService,
              public sing:SingletonService,
              public conn:ConnectivityService,
              public toastCtrl:ToastController,
              public params: NavParams,
              public actionCtrl:ActionSheetController,
              public photo:PhotoViewer) {

    this.fbRef = firebase.database();
    this.user = this.auth.getUser();
    this.eventId = params.get('eventId');
  }


  getMap(label,breweryId) {
    if (this.eventBooths[breweryId] != null) {
      let map = 'https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/event_maps%2F'+this.eventId+'%2F'+this.eventBooths[breweryId].booth+'.gif?alt=media&token=d6838db0-8ce6-4167-8517-8da3d9abbeab';
      this.photo.show(map,label, {share: false});
    } else {
      console.log('Booth not set for breweryId: '+breweryId);
    }
  }

  getVendorMap(vendor) {
    let map = 'https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/event_maps%2F'+this.eventId+'%2F'+vendor.booth+'.gif?alt=media&token=d6838db0-8ce6-4167-8517-8da3d9abbeab';
    this.photo.show(map,'Booth #'+vendor.booth+' - '+vendor.name, {share: false});
  }

  getEventMap() {
    var mapURL = 'https://firebasestorage.googleapis.com/v0/b/bender-1487426215149.appspot.com/o/event_maps%2F'+this.eventId+'%2Fmap.gif?alt=media&token=5bb7d7ee-9a7a-43ee-ac56-4d1c9fa86676'; 
    this.photo.show(mapURL,this.event.name, {share: false});
    //console.log('mapURL',mapURL);
  }

  getBeerList(brewery) {
      let modal = this.modalCtrl.create(EventBreweryBeersPage,{brewery:brewery,eventId:this.eventId});
      modal.onDidDismiss(()=> {
        this.getBeerFavList();
      });
      modal.present();
  }

  getEvent() {
        
    this.showLoading();
    this.eventBreweries = [];

    this.beerAPI.getFeaturedEvent(this.eventId).subscribe(resp=>{

      this.event = resp.data;

      this.beerAPI.getEventBreweries(this.eventId).subscribe(breweries=>{

        if (breweries.totalResults) {

          var brewDB = breweries.data;
          var icon = '';
          var eventBeers = '';
          var booth;
    
          for (var i=0;i<brewDB.length;i++) {
           
            icon = '';
            booth = '';

            if (this.eventBooths[brewDB[i].breweryId] != null)
              booth = this.eventBooths[brewDB[i].breweryId].booth;

            if (brewDB[i].brewery.hasOwnProperty('images'))
              icon = brewDB[i].brewery.images.icon;
            
            this.eventBreweries.push({
              name:brewDB[i].brewery.name,
              logo:icon,
              booth:booth,
              id:brewDB[i].breweryId,
              beers:[],
              city:null,
              state:null
            });
          }

          //console.log('event breweries',this.eventBreweries);

          this.beerAPI.getEventBeers(this.eventId).subscribe(beers=>{

            var numPages;
            var totalBeers;
            var currentPage = 1;
            var beersDB = [];
            let observableBatch = [];

            console.log('beersDB',beers);

            if (beers.totalResults) {

              beersDB = beers.data;
              totalBeers = beers.totalResults;
              numPages = beers.numberOfPages;

              console.log('beersDB',beersDB);
              this.setEventData(beersDB);
              
              if (numPages > 1) {

                currentPage++;

                for (let i=currentPage; i <=numPages ; i++) {
                  observableBatch.push(this.beerAPI.getEventBeers(this.eventId,i));
                }
                
                Observable.forkJoin(observableBatch).subscribe(beerBatch=>{
                  //console.log('beerBatch',beerBatch);
                  for (let i=0; i < beerBatch.length; i++)
                    this.setEventData(beerBatch[i]['data']);

                  this.eventBreweries.sort(this.SORT_BREWERY_NAME);
                  this.showEvent = true;
                  this.loading.dismiss().catch(() => {});                  
                },error=>{
                  console.log(error);
                });                
              } else {
                this.eventBreweries.sort(this.SORT_BREWERY_NAME);
                this.showEvent = true;
                this.loading.dismiss().catch(() => {});                
              }
            }
            /*
            for (var i=0;i<beersDB.length;i++) {

              for (var j=0; j<this.eventBreweries.length;j++) {

                if (this.eventBreweries[j].id === beersDB[i].beer.breweries[0].id) {

                  this.eventBreweries[j].beers.push(beersDB[i].beer);
                  
                  if (this.eventBreweries[j].city == null && beersDB[i].beer.breweries[0].hasOwnProperty('locations')) {
                    this.eventBreweries[j].city = beersDB[i].beer.breweries[0].locations[0].locality;
                    this.eventBreweries[j].state = beersDB[i].beer.breweries[0].locations[0].region;
                  }
                }
              }

              this.eventBeers.push(beersDB[i].beer);
            }

        

          this.eventBreweries.sort(this.SORT_BREWERY_NAME);
          this.showEvent = true;
          this.loading.dismiss().catch(() => {});
            */
          },error=>{
            console.log(error);
            this.loading.dismiss().catch(() => {});
          });
        }
        

       
      },error=>{
        console.log(error);
        this.loading.dismiss().catch(() => {});
      });


    },error=>{
      this.loading.dismiss().catch(() => {});
      console.log(error);
    });
  }

  setEventData(beersDB) {
    for (var i=0;i<beersDB.length;i++) {

      for (var j=0; j<this.eventBreweries.length;j++) {

        if (this.eventBreweries[j].id === beersDB[i].beer.breweries[0].id) {

          this.eventBreweries[j].beers.push(beersDB[i].beer);
          
          if (this.eventBreweries[j].city == null && beersDB[i].beer.breweries[0].hasOwnProperty('locations')) {
            this.eventBreweries[j].city = beersDB[i].beer.breweries[0].locations[0].locality;
            this.eventBreweries[j].state = beersDB[i].beer.breweries[0].locations[0].region;
          }
        }
      }

      this.eventBeers.push(beersDB[i].beer);
    }    
  }

  getDetail(brewery) {

      this.showLoading();

      this.beerAPI.loadBreweryLocations(brewery.id).subscribe(locations=>{

        if (locations.hasOwnProperty('data')) {
          let lat = locations.data[0].latitude;
          let lng = locations.data[0].longitude;
          let locId = locations.data[0].id;

          this.geo.getPlaceFromGoogleByLatLng(brewery.name,lat,lng).subscribe(resp=>{
          
            this.beerAPI.getBreweryDetail(brewery.id,locId).subscribe(pub=>{
              this.loading.dismiss();
              this.navCtrl.push(BreweryDetailPage,{brewery:pub['detail'],beers:pub['beers'],place:resp['result']});        
            },error=>{
              console.log('error getBrewery',error);
              this.loading.dismiss().catch(() => {});
              this.sing.showNetworkAlert();         
            });

          },error=>{
              console.log('error getBreweryFromGoogle',error);
              this.loading.dismiss().catch(() => {});
              this.sing.showNetworkAlert();      
          });          

        }

      },error=>{
        console.log(error);
      });

  }

  getBeerDetail(beerDbId) {

      this.navCtrl.push(BeerDetailPage,{beerId:beerDbId});
  }  

  getEventBeers() {

    let beerList = [];
    beerList = this.eventBeers;

    for (var i = 0; i < beerList.length; i++) {

      if (this.eventBooths[beerList[i].breweries[0].id]!=null)
        beerList[i]['booth'] = this.eventBooths[beerList[i].breweries[0].id].booth;
      else
        beerList[i]['booth'] = null;

      beerList[i]['abv'] = parseFloat(beerList[i]['abv']);
    }
          
    this.eventBeers = beerList;
    this.isGrouped = true;
    this.eventBeers.sort(this.SORT_BEER_STYLE);
    this.groupBeerStyle(this.eventBeers);
  }

  SORT_BEER_NAME(a,b) {

    if (a.nameDisplay < b.nameDisplay)
      return -1;
    if (a.nameDisplay > b.nameDisplay)
      return 1;
    return 0;
  }

  
  SORT_BREWERY_NAME(a,b) {

    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  }

  SORT_BEER_STYLE(a,b) {

    if (a.style.shortName < b.style.shortName)
      return -1;
    if (a.style.shortName > b.style.shortName)
      return 1;
    return 0;

  }   
  
  SORT_ABV_DESC(a,b) {

    if (a.abv > b.abv)
      return -1;
    if (a.abv < b.abv)
      return 1;
    return 0;

  }

  setVendors() {
    //console.log('vendors',this.event);
    let newVendorList = [];

    for(var key in this.eventVendors) {
      //console.log('key',key)
      var obj = this.eventVendors[key];
      obj['booth'] = key;
      newVendorList.push(obj);
    }
    this.eventVendors = newVendorList;
    console.log(this.eventVendors);
    this.groupVendorType(this.eventVendors);
  }

  getSorActions() {
    let actionSheet = this.actionCtrl.create({
      title: 'Sort Beers By',
      buttons: [
        {
          text: 'Name',
          handler: () => {
            this.isGrouped = true;
            this.eventBeers.sort(this.SORT_BEER_NAME);
            this.groupBeerName(this.eventBeers);
          }
        },{
          text: 'ABV Desc',
          handler: () => {
            this.isGrouped = false;
            this.eventBeers.sort(this.SORT_ABV_DESC);            
          }
        },{
          text: 'Beer Style',
          handler: () => {
            this.isGrouped = true;
            this.eventBeers.sort(this.SORT_BEER_STYLE);
            this.groupBeerStyle(this.eventBeers);         
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

  groupVendorType(vendors) {
    //groupedVendors
    let vendorList = vendors;
    let currentType = false;
    let currentVendors = [];
    this.groupedVendors = [];
    console.log('ven',vendorList);
    
    vendorList.forEach((value, index) => {
      //console.log(value+ ' * '+index);
      
      if(value.type != currentType){

          currentType = value.type;

          let newGroup = {
              type: currentType,
              vendors: []
          };

          currentVendors = newGroup.vendors;
          this.groupedVendors.push(newGroup);

      } 
      currentVendors.push(value);
    });
    console.log('group ven',this.groupedVendors);
      
  }

  groupBeerStyle(beers) {
      
      let sortedBeers = beers;
      let currentStyle = false;
      let currentBeers = [];
      this.groupedBeers = [];

      sortedBeers.forEach((value, index) => {

          if(value.style.shortName != currentStyle){

              currentStyle = value.style.shortName;

              let newGroup = {
                  style: currentStyle,
                  beers: []
              };

              currentBeers = newGroup.beers;
              this.groupedBeers.push(newGroup);

          } 
          currentBeers.push(value);
      });
  }

  groupBeerName(beers){
      
      let sortedBeers = beers;
      let currentLetter = false;
      let currentBeers = [];
      this.groupedBeers = [];

      sortedBeers.forEach((value, index) => {

          if(value.name.charAt(0) != currentLetter){

              currentLetter = value.name.charAt(0);

              let newGroup = {
                  style: currentLetter,
                  beers: []
              };

              currentBeers = newGroup.beers;
              this.groupedBeers.push(newGroup);

          } 
          currentBeers.push(value);
      });
  }  

  getBeerFavList() {
    this.approve = [];
    this.fbRef.ref('favorite_beers/'+this.user.uid).once('value').then(snapshot=>{
      snapshot.forEach(item=>{
        this.approve[item.key] = true;
      });
    });    
  }

  saveBeerToFavorites(beer) {
    
    beer['timestamp'] = firebase.database.ServerValue.TIMESTAMP;
    this.fbRef.ref('/favorite_beers/'+this.user.uid+'/'+beer.id).set(beer).then(resp=>{
      this.presentToast(beer.name + ' saved to favorites.');
      this.getBeerFavList();
    });

  }

  removeBeerFromFavorites(beer) {
    this.fbRef.ref('/favorite_beers/'+this.user.uid+'/'+beer.id).remove().then(resp=>{
      this.presentToast(beer.name + ' removed from favorites');
      this.getBeerFavList();
    });    
  }


  getBreweryActions(brewery) {

    let actionSheet = this.actionCtrl.create({
      title: brewery.name,
      buttons: [
        {
          icon: 'beer',
          text: 'Beer List',
          handler: () => {
            this.getBeerList(brewery);
          }
        },{
          icon: 'information',
          text: 'Brewery Detail',
          handler: () => {
            this.getDetail(brewery);            
          }
        },{
          icon: 'map',
          text: 'View Map',
          handler: () => {
            this.getMap('Booth #'+brewery.booth+' - '+brewery.name,brewery.id);            
          }
        },{
          icon: 'close',
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

  getBeerListActions(beer) {

    //console.log('approval',this.approve);
    let removeFromFav = false;
    let favText = 'Save to Favorites';

    if (this.approve[beer.id]!=null) {
      removeFromFav = true;
      favText = 'Remove from Favorites';
    }
    
    let actionSheet = this.actionCtrl.create({
      title: beer.name,
      buttons: [
        {
          icon: 'beer',
          text: 'Beer Detail',
          handler: () => {
            this.getBeerDetail(beer.id);
          }
        },{
          icon: 'map',
          text: 'Find It',
          handler: () => {
            this.getMap('Booth #' + beer.booth + ' - '+beer.name,beer.breweries[0].id);           
          }
        },{
          icon: 'thumbs-up',
          text: favText,
          handler: () => {
            if (removeFromFav)
              this.removeBeerFromFavorites(beer);
            else
              this.saveBeerToFavorites(beer);            
          }
        },{
          icon: 'close',
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
  
  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'top',
      duration: 3000
    });
    toast.present();
  }   

  showLoading() {
    this.loading = this.loadingCtrl.create({});
    this.loading.present();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EventMapPage');

    this.fbRef.ref('/featured_events/').orderByChild('id').equalTo(this.eventId).once('child_added').then(snapshot=>{        
      if (snapshot.exists()) {
        let feat = snapshot.val();

        if (feat.hasOwnProperty('booths'))
          this.eventBooths = feat.booths;

        if (feat.hasOwnProperty('vendors')) {
          this.eventVendors = feat.vendors;
          this.setVendors();
        }

        //console.log('ven',this.eventVendors);

        this.getEvent();        
        //console.log('booths',this.eventBooths);
      }
    });

    
    this.getBeerFavList();
  }

}
