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

    let notifyData = event.data.val();
    let tokensToPush = [];
    let notifyType = '';
    let uid = '';
    let userImg = '';
    let payload = new Object();

    // Only edit data when it is first created.
    if (event.data.previous.exists())
      return;

    // Exit when the data is deleted.
    if (!event.data.exists())
      return;      

    tokensToPush = notifyData.pushTokens;
    notifyType = notifyData.type;
    userImg = notifyData.userIMG;
    uid = notifyData.uid;
    msg = `${notifyData.message}`;
    
    console.log('pushTokens',tokensToPush);
    console.log('userImg',userImg);
    
    if (notifyType === 'friends') {

        payload.data = new Object();
        payload.data['title'] = 'Brew Search';
        payload.data['body'] = msg;
        payload.data['sound'] = 'default';
        payload.data['id'] = uid;
        payload.data['page'] = notifyType;

        if (userImg !== undefined && userImg !== null) {
          payload.data['image'] = userImg;
          payload.data['image-type'] = 'square';
        }

    } else {
        payload.notification = new Object();
        payload.notification['title'] = 'Brew Search';
        payload.notification['body'] = msg;
        payload.notification['sound'] = 'default';
        payload.notification['badge'] = '1';        
    }
    return admin.messaging().sendToDevice(tokensToPush, payload);
});

exports.sendFriendRequestPush = functions.database.ref('/users/{userId}/friendRequests/{friendId}').onWrite(event => {

    let pushToken = '';
    let payload = new Object();

    // Only edit data when it is first created.
    if (event.data.previous.exists())
      return;

    // Exit when the data is deleted.
    if (!event.data.exists())
      return;

   // Get token   
   return loadUser(event.params.userId).then(user=>{
     console.log('user',user.pushToken);
     //pushToken = friend.pushToken;
     
     return loadUser(event.params.friendId).then(friend=>{

        payload.data = new Object();
        payload.data['title'] = 'Brew Search';
        payload.data['body'] = friend.name + ' sent you a friend request';
        payload.data['sound'] = 'default';
        payload.data['id'] = event.params.friendId;
        payload.data['page'] = 'friend-request';

        if (friend.photo !== undefined && friend.photo !== null) {
          payload.data['image'] = friend.photo;
          payload.data['image-type'] = 'square';
        }

       //console.log('friend',friend);
       return admin.messaging().sendToDevice(user.pushToken, payload);
     });
   });
});

function loadUser(uid) {
    let dbRef = admin.database().ref('/users/'+uid);
    let defer = new Promise((resolve, reject) => {
        dbRef.once('value', (snap) => {
            let data = snap.val();
            resolve(data);
        }, (err) => {
            reject(err);
        });
    });
    return defer;
}