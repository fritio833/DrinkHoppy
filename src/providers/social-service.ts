import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

import firebase from 'firebase';

import { Facebook,SocialSharing } from 'ionic-native';
import { GooglePlus } from '@ionic-native/google-plus';
import { TwitterConnect } from '@ionic-native/twitter-connect';

import { SingletonService } from './singleton-service';

@Injectable()
export class SocialService {

  public fbRef:any;
  
  constructor(public sing:SingletonService) {
    console.log('Hello SocialService Provider');
  }

  shareFacebook(caption,description,picURL,shareType?,shareId?) {
    return new Observable(observer => {
      let link = this.sing.webURL;
      let subDirectory = '';
    
      if (shareType != null && shareId != null) {

        switch(shareType) {
          case 'brewery': 
              link = link + '/b/' + shareId; 
            break;
          case 'beer':
              link = link +'/beer/'+shareId;
            break;
          case 'place':
              link = link +'/bar/'+shareId;
            break;
          case 'checkin':
              link = link +'/checkin/'+shareId
            break;
        }
        //link = link + '/' + subDirectory + '/' + shareId;
        console.log('link',link);

      }
      
      
      Facebook.showDialog({
        method: 'share',
        href: link
      }).then(success=>{
        observer.next(success);
        observer.complete();
      }).catch(error=>{
        observer.error(error);
        observer.complete();
      });
      
    });
  }

  // TODO: function appInvite(options, options.url, options.picture)
  // https://ionicframework.com/docs/native/facebook/


}
