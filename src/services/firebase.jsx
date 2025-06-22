// src/services/firebase.js

/* global __initial_auth_token */ // ESLint global declaration for Canvas environment variable

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Assuming you need Storage as discussed

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCENbG6LtD_dVaNoqyoJuLmxiyTQNi6e0E", // Your Web API Key for homifi-4d283
  authDomain: "homifi-4d283.firebaseapp.com",
  projectId: "homifi-4d283",
  storageBucket: "homifi-4d283.appspot.com",
  messagingSenderId: "434013049134",
  appId: "1:434013049134:web:YOUR_ACTUAL_WEB_APP_ID", // IMPORTANT: Get YOUR web app's specific appId from Firebase Console Project Settings -> Your apps
  // measurementId: "G-XXXXXXXXXX" // Only include if you have Google Analytics set up for this specific project and need it
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Get service instances
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Initialize Authentication State ---
// This block ensures a user is authenticated when the app starts,
// either using a provided custom token (from Canvas environment)
// or by signing in anonymously as a fallback.
// The `auth/admin-restricted-operation` error often occurs if Anonymous auth is not enabled.
const initializeFirebaseAuth = async () => {
  try {
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      // If a custom auth token is provided by the environment (e.g., Canvas)
      await signInWithCustomToken(auth, __initial_auth_token);
      console.log("Signed in with custom token.");
    } else {
      // Fallback to anonymous sign-in if no custom token is available
      // IMPORTANT: For this to work, you MUST ENABLE "Anonymous" provider in Firebase Console:
      // Authentication -> Sign-in method tab -> Anonymous -> Enable
      await signInAnonymously(auth);
      console.log("Signed in anonymously.");
    }
  } catch (error) {
    console.error("Firebase Auth Initialization Error:", error.code, error.message);
    // Specific instruction: Avoid early returns to allow app to proceed even with auth issues
    // You might want to display a user-friendly error message in the UI here.
  }
};

initializeFirebaseAuth(); // Call the initialization function when the script loads

// Export the service instances for use throughout your application
export { auth, db, storage };
