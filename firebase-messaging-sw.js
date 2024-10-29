importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyANjmvEbmPU8pcbPdW6lTOXAvrFaRBeOOQ",
    authDomain: "alertnotifications-16b91.firebaseapp.com",
    projectId: "alertnotifications-16b91",
    storageBucket: "alertnotifications-16b91.appspot.com",
    messagingSenderId: "631436307545",
    appId: "1:631436307545:web:7465f8bec369b7f04bd548"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = "payload.notification.title";
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});