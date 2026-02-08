import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, isSupported } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIlSPh6GPPHdumTYmkuowo_8SXpHIVbmA",
  authDomain: "proserp-faea0.firebaseapp.com",
  projectId: "proserp-faea0",
  storageBucket: "proserp-faea0.appspot.com",
  messagingSenderId: "907299356831",
  appId: "1:907299356831:web:b4c18d752233178797a2aa"
};

// Initialize Firebase App (safe even on server)
const app = initializeApp(firebaseConfig);

let messaging: any = null;

// Initialize messaging only in the browser
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { messaging };
