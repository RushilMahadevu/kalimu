import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});


const handleAuthError = (error) => {
  if (error.code === 'auth/popup-closed-by-user') {
    return {
      error: true,
      message: 'Sign-in cancelled. Please try again if you want to sign in.'
    };
  }
  return {
    error: true,
    message: 'An error occurred during sign-in. Please try again.'
  };
};

export { auth, db, loadUserVisits, loadGPAHistory, handleAuthError };


// Function to load user visits
const loadUserVisits = async (userId) => {
  try {
    const userVisitsRef = collection(db, 'users', userId, 'plannedVisits');
    const snapshot = await getDocs(userVisitsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error loading visits:', error);
    return [];
  }
};

const loadGPAHistory = async (userId) => {
  if (!userId || !auth.currentUser) {
    console.error('No user ID provided or user not authenticated');
    return [];
  }
  
  try {
    const userGPARef = collection(db, 'users', userId, 'gpaHistory');
    const snapshot = await getDocs(userGPARef);
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error loading GPA history:', error);
    return []; // Return empty array instead of throwing
  }
};
