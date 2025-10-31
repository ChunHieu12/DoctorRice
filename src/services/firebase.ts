/**
 * Firebase Configuration
 * Used for Phone Authentication
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// Firebase config from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyA9EKcMOEtsSKjQITlWDXBTVZEX2lu0zeU",
  authDomain: "doctorrice-4e19f.firebaseapp.com",
  projectId: "doctorrice-4e19f",
  storageBucket: "doctorrice-4e19f.firebasestorage.app",
  messagingSenderId: "1083778765486",
  appId: "1:1083778765486:android:54b174bb733e3e9b8f533f"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();

// For debugging
if (__DEV__) {
  console.log('🔥 Firebase initialized:', {
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId
  });
}

export default firebase;

