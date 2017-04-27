const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
/*
 exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});
*/
exports.sendPush = functions.database.ref('/notifications/{notificationId}').onWrite(event => {

    let notifyCreated = false;
    let notifyData = event.data.val();
    let tokensToPush = [];
    let payload = '';
    let notifyType = '';
    let uid = '';
    let userImg = '';

    if (!event.data.previous.exists()) {
        notifyCreated = true;
        tokensToPush = notifyData.pushTokens;
        notifyType = notifyData.type;
        userImg = notifyData.userIMG;
        uid = notifyData.uid;
    } else {
      return;
    }

    if (notifyCreated) {
        msg = `${notifyData.message}`;
    }
    
    console.log('pushTokens',tokensToPush);
    console.log('userImg',userImg);
    
    if (notifyType === 'friends') {
        if (userImg !== undefined && userImg !== null) {
            payload = {
                data: {
                    title: 'Brew Search',
                    body: msg,
                    sound: 'default',                
                    'image': userImg,
                    'image-type':'circle',             
                    'page':notifyType,               
                    id: uid
                }
            };
        } else {
            payload = {
                data: {
                    title: 'Brew Search',
                    body: msg,
                    sound: 'default',            
                    'page':notifyType,               
                    id: uid
                }
            };            
        }
    } else {
        payload = {
            notification: {
                title: 'Brew Search',
                body: msg,
                sound: 'default',
                badge: '1'
            }
        };        
    }
    return admin.messaging().sendToDevice(tokensToPush, payload);
});