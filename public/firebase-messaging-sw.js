importScripts('https://www.gstatic.com/firebasejs/9.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.4.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the config object
firebase.initializeApp({
    apiKey: "AIzaSyBIlSPh6GPPHdumTYmkuowo_8SXpHIVbmA",
    authDomain: "proserp-faea0.firebaseapp.com",
    projectId: "proserp-faea0",
    storageBucket: "proserp-faea0.appspot.com",
    messagingSenderId: "907299356831",
    appId: "1:907299356831:web:b4c18d752233178797a2aa"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();


