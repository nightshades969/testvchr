// src/firebase.js
import { initializeApp } from "firebase/app";
//import { getFirestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  //apiKey: "YOUR_API_KEY",
  //authDomain: "YOUR_AUTH_DOMAIN",
  //projectId: "YOUR_PROJECT_ID",
  //storageBucket: "YOUR_STORAGE_BUCKET",
  //messagingSenderId: "YOUR_SENDER_ID",
  //appId: "YOUR_APP_ID"
  
  
  // apiKey: "AIzaSyAvlBEqk54-fGA9bRcx4gZN24uDb0AqU74",
  // authDomain: "fbvchr-ecbd6.firebaseapp.com",
  // projectId: "fbvchr-ecbd6",
  // storageBucket: "fbvchr-ecbd6.firebasestorage.app",
  // messagingSenderId: "188660107058",
  // appId: "1:188660107058:web:1ebd35bde6d3c47c0df92b",
  // measurementId: "G-8RKKP6Y9CH"
  
  apiKey: "AIzaSyD_nKJpIfzU0N05l2Fg9SIIrsJkG-E4jEQ",

  authDomain: "jchdbasereact.firebaseapp.com",

  projectId: "jchdbasereact",

  storageBucket: "jchdbasereact.firebasestorage.app",

  messagingSenderId: "480490803095",

  appId: "1:480490803095:web:e0f4125a495a271361bed2"

  
  
  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };

