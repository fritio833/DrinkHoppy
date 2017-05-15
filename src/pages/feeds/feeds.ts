import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { SingletonService } from '../../providers/singleton-service';

import firebase from 'firebase';

@Component({
  selector: 'page-feeds',
  templateUrl: 'feeds.html'
})
export class FeedsPage {

  public feeds:FirebaseListObservable<any>;
  public fbRef:any;
  public limit:any;
  public lastKey:string;
  public feedLen:number;
  public queryable:boolean = true;
  public checkinsPerPage:number;
  public loading:any;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public sing: SingletonService,
              public loadingCtrl:LoadingController,
              public angFire:AngularFire) {

    this.limit = new BehaviorSubject(this.sing.checkinsPerPage);
    this.fbRef = firebase.database();
    this.checkinsPerPage = this.sing.checkinsPerPage;
  }

  getFeeds() {
    this.showLoading();
    this.feeds =  this.angFire.database.list('/checkin/feeds/',{
      query:{
        orderByChild:'priority',
        limitToFirst: this.limit
      }
    });
  
    this.angFire.database.list('/checkin/feeds/',{
      query: {
        orderByChild: 'priority',
        limitToLast: 1
      }
    }).subscribe((data) => {
      // Found the last key
      if (data.length > 0) {
        this.lastKey = data[0].$key;
      } else {
        this.lastKey = '';
      }
      this.loading.dismiss().catch(()=>{});
    },error=>{
      this.loading.dismiss().catch(()=>{});
    });
  
    this.feeds.subscribe(resp=>{
      this.feedLen = resp.length;
      //console.log('resp',resp);
      if (resp.length > 0) {
        // If the last key in the list equals the last key in the database
        if (resp[resp.length - 1].$key === this.lastKey) {
          this.queryable = false;
        } else {
          this.queryable = true;
        }
      }      
    });    
  }


 getMoreCheckins(infiniteScroll) {
   //console.log('inf',infiniteScroll);
    setTimeout(() => {
      if (this.queryable)
        this.limit.next(this.limit.getValue()+this.checkinsPerPage);

      infiniteScroll.complete();

      if (!this.queryable)
        infiniteScroll.enable(false);
    }, 1000);
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({});
    this.loading.present();
  }  

  ionViewDidLoad() {
    console.log('ionViewDidLoad FeedsPage');
    this.getFeeds();
  }

}
