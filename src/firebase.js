

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 1. Import getFirestore

// Your web app's Firebase configuration
// Make sure this is still filled in with your actual keys
const firebaseConfig = {
  apiKey: "AIzaSyD6pf6KrLyfc96MTcF50sFwMlV8sJIBnf4",
  authDomain: "chronocapsule-33457.firebaseapp.com",
  projectId: "chronocapsule-33457",
  storageBucket: "chronocapsule-33457.appspot.com",
  messagingSenderId: "812921232366",
  appId: "1:812921232366:web:7390e5c31d5f5e9c2f0cff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services for use in your components
export const auth = getAuth(app);
export const db = getFirestore(app); // 2. Initialize and export db