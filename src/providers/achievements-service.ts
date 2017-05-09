import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

import firebase from 'firebase';

@Injectable()
export class AchievementsService {

  public fbRef:any;

  constructor() {
    this.fbRef = firebase.database();
    console.log('Hello AchievementsService Provider');
  }

  getNextAchievement(uid) {
    return new Promise((resolve,reject)=>{
      let earnedKey = new Array();

      this.fbRef.ref('/achievements_user/'+uid+'/earned/').once('value').then(earned=>{
        
        if (earned.val() == null) {
          this.fbRef.ref('/achievements/').orderByChild('priority').once('child_added').then(snapshot=>{
            resolve(snapshot.val());
          }).catch(error=>{
            console.log('error getNextAchievement',error);
          });
        } else {
          earned.forEach(item=>{
            earnedKey.push(item.key);
          });
          this.fbRef.ref('/achievements/').orderByChild('priority').once('value').then(snapshot=>{

            let achieveKey = new Array();
            snapshot.forEach(item=>{
              achieveKey.push(item.key);
            });
            
            let filtered = achieveKey.filter(function(val) {
              return earnedKey.indexOf(val) == -1;
            });
            
            if (filtered.length) {
              let filteredSnap = snapshot.val();
              console.log('next achieve',filteredSnap[filtered[0]]);
              resolve(filteredSnap[filtered[0]]);
            } else
              resolve(false);
          }).catch(error=>{
            console.log('error getNextAchievement',error);
          });
        }
      });
    });
  }

 
  getAllEarnedAchievementKeys(uid) {
    let key = new Array();
    return new Observable(observer => {
      
      this.fbRef.ref('/achievements_user/'+uid+'/earned/').once('value').then(snapshot=>{
        console.log(' earned achievements',snapshot.val());
        snapshot.forEach(item=>{
          key.push(item.key);
        });
        observer.next(key);
        observer.complete();
      }).catch(error=>{
        console.log('error getNextAchievement',error);
        observer.error(error);
      });
    });    
  }

  getAllAchievements(uid) {
    return new Promise((resolve,reject)=>{
      var achieve = new Array();
      var _earned = new Array();


      this.fbRef.ref('/achievements_user/'+uid+'/earned/').once('value').then(earned=>{
        console.log('earned',earned.val());
        earned.forEach(item=>{
            _earned.push(item.key);
        });

        this.fbRef.ref('/achievements/').orderByChild('priority').once('value').then(snapshot=>{
          //console.log('achievements',snapshot.val());
          snapshot.forEach(item=>{
            let _item = {};
            _item = item.val();
            _item['key'] = item.key;
            _item['earned'] = false;
            for (var i = 0; i < _earned.length; i++) {
              if (item.key == _earned[i])
                _item['earned'] = true;
            }
            achieve.push(_item);  
          });
          console.log('achieve',achieve);
           resolve(achieve);
        });  

      });
     
    });
    
  }

  getAchievement(uid,achieveKey,lookup) {
    return new Observable(observer => {   

      let key = '';
      let achieveObj = {};
      let _recurring = false;
      let completion = 0;

      switch (lookup) {
        case 'beerCategory':
          key = achieveKey.toLowerCase().replace(/\s/g, "-");
          break;
        default:
            observer.next(false);
            observer.complete();
            return;   
      }

      this.fbRef.ref('/achievements/'+key).once('value').then(snapshot=>{
        //let checkinCount = snapshot.val();
        console.log('achieve snapshot',snapshot.val());
        _recurring = snapshot.val().recurring;
        completion = parseInt(snapshot.val().completion);

        this.fbRef.ref('/achievements_user/'+uid+'/earned/'+snapshot.key).once('value').then(earned=>{
          if (!_recurring && earned.exists()) {
            observer.next(false);
            observer.complete();             
          } else {

            if (snapshot.val()!=null) {
              
              achieveObj = snapshot.val();
              achieveObj['key'] = snapshot.key;

              this.fbRef.ref('/achievements_user/'+uid+'/progress/'+snapshot.key).once('value').then(progress=>{
                if (progress.exists()) {
                  
                  let _progress = parseInt(progress.val().progress);
                  let _complete = completion;
                  
                  _progress++;
                  console.log('_compplete progress: ' + _complete+ ' - '+_progress ,_complete <= _progress);                  
                  if (_complete <= _progress) {

                    if (earned.exists() && _recurring) {
                      let count = earned.val().count;

                      if (count == null)
                        count = 0;

                      count++;
                      this.fbRef.ref('/achievements_user/'+uid+'/earned/'+snapshot.key).update({
                        count:count,
                        earnDate:firebase.database.ServerValue.TIMESTAMP
                      }).then(success=>{
                        this.fbRef.ref('/achievements_user/'+uid+'/progress/'+snapshot.key).remove();
                        observer.next(achieveObj);
                        observer.complete();                      
                      });    
                    } else {
                      this.fbRef.ref('/achievements_user/'+uid+'/earned/'+snapshot.key).set({
                        earnDate:firebase.database.ServerValue.TIMESTAMP,
                        count:1
                      }).then(success=>{
                        this.fbRef.ref('/achievements_user/'+uid+'/progress/'+snapshot.key).remove();
                        observer.next(achieveObj);
                        observer.complete();                      
                      });
                    }

                  } else {
                    this.fbRef.ref('/achievements_user/'+uid+'/progress/'+snapshot.key).update({
                      progress:_progress
                    }).then(resp=>{
                      observer.next(false);
                      observer.complete();                      
                    });                
                  }
                } else {
                  if (completion == 1) {
                    this.fbRef.ref('/achievements_user/'+uid+'/earned/'+snapshot.key).set({
                      earnDate:firebase.database.ServerValue.TIMESTAMP
                    }).then(resp=>{
                        observer.next(achieveObj);
                        observer.complete();                  
                    });
                  } else {
                    this.fbRef.ref('/achievements_user/'+uid+'/progress/'+snapshot.key).set({
                      progress:1,
                      completion:snapshot.val().completion
                    }).then(resp=>{
                        observer.next(false);
                        observer.complete();                    
                    });
                  }
                } 
              });

            } else {
              observer.next(false);
              observer.complete();
            }
          }
        });
      }).catch(error=>{
        observer.error(error);
      });
    });    
  }

  getAchievementDetail(achieveId,uid) {
    let achieve:any;
     return new Observable(observer => { 
       this.fbRef.ref('/achievements/'+achieveId).once('value').then(snapshot=>{
         achieve = snapshot.val();
         achieve['earnDate'] = '';
         this.fbRef.ref('/achievements_user/'+uid+'/earned/'+achieveId).once('value').then(earned=>{
           if (earned.exists()) {
             achieve['earnDate'] = earned.val().earnDate;
             achieve['count'] = earned.val().count;      
           }

           this.fbRef.ref('/achievements_user/'+uid+'/progress/'+achieveId).once('value').then(progress=>{
              if(progress.exists()) {
                 achieve['progress'] = progress.val().progress;
              }
              console.log('achieve',achieve);
              observer.next(achieve);
              observer.complete();
           });
         });   
       });
     });
  }

  setCountAchievement(uid,count) {
    return new Observable(observer => {   
      // User checkin count
      let key = count +'-checkins';
      let achieveObj = {};
      this.fbRef.ref('/achievements/'+key).once('value').then(snapshot=>{
        //let checkinCount = snapshot.val();

        if (snapshot.val()!=null) {
          
          achieveObj = snapshot.val();
          achieveObj['key'] = snapshot.key;
          this.fbRef.ref('/achievements_user/'+uid+'/earned/'+snapshot.key).set({
            earnDate:firebase.database.ServerValue.TIMESTAMP,
            count:1
          });
          console.log('achieve',achieveObj);
          observer.next(achieveObj);
          observer.complete();
        } else {
          observer.next(false);
          observer.complete();
        }
      }).catch(error=>{
        observer.error(error);
      });
    });
  }
}
