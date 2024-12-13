// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgdlP036KalMU5JSJR3hat1XhxrIZqPr8",
  authDomain: "kalimu-35418.firebaseapp.com",
  projectId: "kalimu-35418",
  storageBucket: "kalimu-35418.firebasestorage.app",
  messagingSenderId: "696292516120",
  appId: "1:696292516120:web:6bbfd9f89b551ead96fe6d",
  measurementId: "G-TL4DHQWCD5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);