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

      
      if (shareType != null && shareId != null) {
        link = link + '/' + shareType + '/' + shareId;
        console.log('link',link);
      }
      
      
      Facebook.showDialog({
        method: 'share',
        href: link,
        caption: caption,
        description: description,
        picture: picURL      
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
