import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import '../App.css'; // Assuming common styles are in App.css
import './AdminLogin.css'; // Specific styles for AdminLogin

// IMPORTANT: Ensure this firebaseConfig is correct for your project
const firebaseConfig = {
  apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A",
  authDomain: "homifi-bac92.firebaseapp.com",
  projectId: "homifi-bac92",
  storageBucket: "homifi-bac92.appspot.com",
  messagingSenderId: "876737044340",
  appId: "1:876737044340:web:07d098db6f17f9c80bd621"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // This useEffect ensures the component logs out if a user tries to access AdminLogin
  // while already authenticated as a regular user, or if state is weird.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // If a user is already authenticated and lands on AdminLogin,
      // you might want to redirect them or ensure they are properly logged out.
      // For now, the explicit signOut in handleLogin handles non-admin authenticated users.
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // --- DEBUGGING LINE: CHECK THE UID HERE ---
      console.log("Authenticated User UID:", user.uid);
      // --- END DEBUGGING LINE ---

      // 1. Get a reference to the potential admin document in the 'admins' collection
      const adminDocRef = doc(db, 'admins', user.uid);

      // 2. Fetch the document
      const adminDocSnap = await getDoc(adminDocRef);

      // 3. Check if the document exists in the 'admins' collection
      if (adminDocSnap.exists()) {
        console.log('Admin login successful for UID:', user.uid);
        // onLoginSuccess(); // Call the prop function if you pass it from App.js to update overall app state
        navigate('/admin-dashboard'); // Redirect to Admin Dashboard
      } else {
        // If the user authenticated but is not in the 'admins' collection
        await auth.signOut(); // Log out the user immediately
        setError('Access Denied: You do not have administrator privileges.');
        console.log('Login failed: User is not an admin:', user.uid);
      }

    } catch (firebaseError) {
      console.error("Firebase Login Error:", firebaseError);
      // More user-friendly error messages based on Firebase error codes
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        case 'auth/user-disabled':
          setError('Your account has been disabled.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // Newer versions of Firebase might use this
          setError('Invalid email or password.'); // Generic message for security
          break;
        default:
          setError(`Login failed: ${firebaseError.message}`);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;