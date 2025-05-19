// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A", // Your Web API Key
  authDomain: "homifi-bac92https://www.google.com/search?q=.firebaseapp.com",  //  Should be your projectIDhttps://www.google.com/search?q=.firebaseapp.com
  projectId: "homifi-bac92",        // Your Project ID
  storageBucket: "homifi-bac92https://www.google.com/search?q=.appspot.com", //  Should be your projectIDhttps://www.google.com/search?q=.appspot.com
  messagingSenderId: "876737044340",  // Your Project Number
  appId: "1:876737044340:web:07d098db6f17f9c80bd621", //  This is unique to your app.  Get this from Firebase Console
  measurementId: "G-M3L18TRTWF"      //  This is optional.
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };