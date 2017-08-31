import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/retrywhen';

import { Observable } from 'rxjs/Observable';
import { SingletonService } from './singleton-service';
import { Beer } from '../models/beer';
import { Platform } from 'ionic-angular';

/*
  Generated class for the BreweryService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/

@Injectable()

export class BreweryService {

  public data:any;
  public breweryDbAPI:any;
  public breweryDbUrl:any;

  constructor(public http: Http, public single:SingletonService, public platform:Platform) {
  	this.http = http;
  	this.data = null;

    this.breweryDbAPI = single.breweryDbAPIKey;

    if (this.platform.is('cordova')) {       
      this.breweryDbUrl = 'http://api.brewerydb.com/v2/';   
    } else {
      this.breweryDbUrl = 'v2/';
    }

  	console.log('Hello BreweryService Provider');
  }
  
  loadBeerByName(beerName,page?,filter?)  {

    let _page = '';
    let _filter = '';

    if (page!=null)
      _page = '&p=' + page;

    //console.log('filter',filter);
    
    if (filter!=null) {

      if (filter.styleId!=null)
        _filter += '&styleId=' + filter.styleId;

      if (filter.isOrganic!=null && filter.isOrganic)
        _filter += '&isOrganic=Y';

      if (filter.minABV!=null)
        _filter += '&abv=' + filter.minABV + ',20';

      if (filter.minIBU!=null)
        _filter += '&ibu=' + filter.minIBU + ',100';

      if (filter.showLabels!=null && filter.showLabels)
        _filter += '&hasLabels=Y';

      if (filter.sortBy!=null)
        _filter += '&sort=' + filter.sortBy;

      if (beerName!=null && beerName.length)
        _filter += '&name=*' + beerName + '*';

      return this.http.get(this.breweryDbUrl 
           + 'beers/?key=' 
           + this.breweryDbAPI 
           + _page
           + _filter 
           +'&withBreweries=Y')
           .retryWhen(error => error.delay(500))
           .timeout(5000,new Error('delay exceeded'))
           .map(res => res.json());
    } else {
      return this.http.get(this.breweryDbUrl 
           + 'search/?key=' 
           + this.breweryDbAPI 
           + '&q=' + beerName
           + _page 
           +'&type=beer&withBreweries=Y')
           .retryWhen(error => error.delay(500))
           .timeout(5000,new Error('Error connecting'))           
           .map(res => res.json());
    }
  }

  getFestivals() {
    return this.http.get(this.breweryDbUrl 
           + 'events/?key=' 
           + this.breweryDbAPI 
           + '&type=festival&year=2017')
           .retryWhen(error => error.delay(500))
           .timeout(5000)
           .map(res => res.json());    
  }

  findBeerByName(name) {
    return this.http.get(this.breweryDbUrl 
           + 'search/?key=' 
           + this.breweryDbAPI 
           + '&q=' + name
           + '&withBreweries=Y&type=beer')
           .retryWhen(error => error.delay(500))
           .timeout(5000)
           .map(res => res.json());
  }

  findBreweriesByName(name) {
    return this.http.get(this.breweryDbUrl 
           + 'search/?key=' 
           + this.breweryDbAPI 
           + '&q=' + name
           + '&withLocations=Y&type=brewery')
           .retryWhen(error => error.delay(500))
           .timeout(5000)
           .map(res => res.json());    
  }

  getFeaturedEvent(eventId) {
    return this.http.get(this.breweryDbUrl 
           + 'event/'
           + eventId
           + '?key=' 
           + this.breweryDbAPI)
           .retryWhen(error => error.delay(500))
           .timeout(5000)
           .map(res => res.json());    
  }

  getEventBreweries(eventId) {
    return this.http.get(this.breweryDbUrl 
           + 'event/'
           + eventId
           + '/breweries?key=' 
           + this.breweryDbAPI)
           .retryWhen(error => error.delay(500))
           .timeout(5000)
           .map(res => res.json());    
  }

  getEventBeers(eventId) {
    return this.http.get(this.breweryDbUrl 
           + 'event/'
           + eventId
           + '/beers?key=' 
           + this.breweryDbAPI)
           .retryWhen(error => error.delay(500))
           .timeout(5000)
           .map(res => res.json());    
  }  

  suggestBeers(beerId) {
    return this.http.get(this.breweryDbUrl 
           + 'beer/'
           + beerId
           + '/variations?key=' 
           + this.breweryDbAPI)
           .retryWhen(error => error.delay(500))
           .timeout(5000)
           .map(res => res.json());    
  }

  getRandomBeers(page?) {

    let _page = '';
    let _filter = '';

    if (page!=null)
      _page = '&p=' + page;

    return this.http.get(this.breweryDbUrl 
           + 'beers/?key=' 
           + this.breweryDbAPI
           + _page
           +'&randomCount=10&availableId=1&order=random&withBreweries=Y')
           .retryWhen(error => error.delay(500))
           .timeout(5000)
           .map(res => res.json());      
  }

  // NOT BEING USED
  /*
  findBreweriesByCity(city) {
    return this.http.get(this.breweryDbUrl 
           + 'locations/?key=' 
           + this.breweryDbAPI 
           + '&locality=' + city)
           .map(res => res.json());
  }
  */

  findBreweriesByGeo(lat,lng,radius?) {
    let _radius = 25;

    if (radius != null) {
      _radius = radius;
    }

    return this.http.get(this.breweryDbUrl 
           + 'search/geo/point?lat='
           + lat
           + '&lng='
           + lng
           + "&radius=" + _radius 
           + '&key='           
           + this.breweryDbAPI)
           .retryWhen(error => error.delay(500))
           .timeout(5000,new Error('Error connecting'))           
           .map(res => res.json());
  }

  // NOT USED
  /*
  loadBreweryById(breweryId) {
    return this.http.get(this.breweryDbUrl 
         + 'brewery/' 
         + breweryId 
         + '/?key=' + this.breweryDbAPI)
        .map(res => res.json());    
  }
  */
  loadBreweryLocations(breweryId) {
    return this.http.get(this.breweryDbUrl 
         + 'brewery/'+breweryId+'/locations'
         + '/?key=' + this.breweryDbAPI)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))         
         .map(res => res.json());
  }

  loadLocationById(locationId) {
    return this.http.get(this.breweryDbUrl 
         + 'location/'+locationId
         + '/?key=' + this.breweryDbAPI)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
         .map(res => res.json());
  }  

  loadBreweryBeers(breweryId) {
    return this.http.get(this.breweryDbUrl 
         + 'brewery/' 
         + breweryId 
         + '/beers?key=' + this.breweryDbAPI)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
         .map(res => res.json()); 
  }

  loadBeerById(beerId)  {

    return this.http.get(this.breweryDbUrl 
         + 'beer/' 
         + beerId 
         + '/?key=' + this.breweryDbAPI
         + '&type=beer&withBreweries=Y')
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))         
         .map(res => res.json());
  } 

  loadBeerCategories() {
    return this.http.get(this.breweryDbUrl 
         + 'categories/'
         + '?key=' + this.breweryDbAPI)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
         .map(res => res.json());
  }

  loadBeerStyles() {

    return this.http.get(this.breweryDbUrl 
         + 'styles/'
         + '?key=' + this.breweryDbAPI)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
         .map(res => res.json());    
  }

  loadMenuStyles() {

    return this.http.get(this.breweryDbUrl 
         + 'menu/styles/'
         + '?key=' + this.breweryDbAPI)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
         .map(res => res.json());    
  }

  loadMenuAvailability() {
    return this.http.get(this.breweryDbUrl 
         + 'menu/beer-availability/'
         + '?key=' + this.breweryDbAPI)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
         .map(res => res.json());    
  }

  postNewBeer(beerData) {

    var headers = new Headers();
    headers.append('Content-Type','application/json');
    let options = new RequestOptions({ headers: headers });

    //console.log('json string',this.single.jsonToQueryString(beerData));
    return this.http.post(this.breweryDbUrl 
         + 'beers'
         + '?key=' + this.breweryDbAPI + this.single.jsonToQueryString(beerData),null,options)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
         .map(res => res.json());  
  }

  postNewBrewery(breweryData) {
    var headers = new Headers();
    headers.append('Content-Type','application/json');
    let options = new RequestOptions({ headers: headers });

    console.log('json string',this.single.jsonToQueryString(breweryData));
    
    return this.http.post(this.breweryDbUrl 
         + 'breweries'
         + '?key=' + this.breweryDbAPI + this.single.jsonToQueryString(breweryData),null,options)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
         .map(res => res.json());    
  }

  loadMenuSRM() {
    return this.http.get(this.breweryDbUrl 
         + 'menu/srm/'
         + '?key=' + this.breweryDbAPI)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
         .map(res => res.json());    
  }

  loadMenuTemp() {
    return this.http.get(this.breweryDbUrl 
         + 'menu/beer-temperature/'
         + '?key=' + this.breweryDbAPI)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
         .map(res => res.json());    
  }  

  loadBeerGlassware() {
    return this.http.get(this.breweryDbUrl 
         + 'glassware/'
         + '?key=' + this.breweryDbAPI)
         .retryWhen(error => error.delay(500))
         .timeout(5000,new Error('Error connecting'))          
        .map(res => res.json());    
  }

  getBreweryDetail(breweryId,breweryLocId) {
    return new Observable(observer=>{
      this.loadLocationById(breweryLocId).subscribe((pub)=>{
              
        this.loadBreweryBeers(breweryId).subscribe((beers)=>{
          let brewery = {};
          brewery['detail'] = pub.data;
          brewery['beers'] = beers;
          observer.next(brewery);
          observer.complete();
        },error=>{
          console.log('error loadBreweryBeers',error);
          observer.error(error);
        });
      },error=>{
        console.log('error locationById',error);
        observer.error(error);
      });
    });
  }

}
