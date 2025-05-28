import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getApps, getApp, initializeApp } from 'firebase/app'; // Import for Firebase app check
import './UserLogin.css'; // Reuse existing styling for login forms

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false); // New loading state

  // Initialize Firebase app if not already initialized
  // This is a fallback; ideally, Firebase is initialized once at the root of your app.
  const firebaseConfig = {
    apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A",
    authDomain: "homifi-bac92.firebaseapp.com",
    projectId: "homifi-bac92",
    storageBucket: "homifi-bac92.appspot.com",
    messagingSenderId: "876737044340",
    appId: "1:876737044340:web:07d098db6f17f9c80bd621"
  };
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Start loading

    if (!email || !password) {
      setError('Please fill in both fields.');
      setLoading(false);
      return;
    }

    // Explicitly check for the allowed admin email
    const allowedAdminEmail = 'Homifi7@gmail.com';
    const allowedAdminPassword = 'homifi777@'; // Note: This is hardcoded for demonstration as per request.

    if (email !== allowedAdminEmail || password !== allowedAdminPassword) {
        setError('Invalid admin credentials.');
        setLoading(false);
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // After successful Firebase Auth login, check user's role in Firestore
      // The user's UID is used to fetch their specific document from the 'users' collection.
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
        console.log('Admin logged in with:', user.email);
        // Navigate to Admin Dashboard
        navigate('/admin-dashboard');
      } else {
        // If user is not an admin or role is not 'admin', log them out from Firebase Auth
        await auth.signOut();
        setError('Access Denied: You do not have administrator privileges.');
      }
    } catch (firebaseError) {
      let errorMessage = 'Login failed. Please check your credentials.';
      // Specific Firebase error codes for better user feedback
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      }
      console.error('Admin login error:', firebaseError);
      setError(errorMessage);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      // Display success message using the error state for consistency with other messages
      setError('Password reset email sent! Please check your inbox.');
      setForgotPassword(false); // Go back to login form
    } catch (firebaseError) {
      let errorMessage = 'Failed to send reset email. Please try again.';
      if (firebaseError.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      }
      console.error('Password reset error:', firebaseError);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Admin Login</h2>

        {!forgotPassword ? (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading} // Disable input during loading
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading} // Disable input during loading
            />
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="role-button admin" disabled={loading}>
              {loading ? 'Logging In...' : 'Login'}
            </button>

            <p className="forgot-password" onClick={() => !loading && setForgotPassword(true)}>
              Forgot Password?
            </p>
            <p className="back-to-login" onClick={() => navigate('/')}>
              ← Back to Login Page
            </p>
          </form>
        ) : (
          <div className="forgot-password-form">
            <h3>Reset Password</h3>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            {error && <p className="error-message">{error}</p>}
            <button type="button" className="role-button admin" onClick={handleForgotPassword} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
            <p className="back-to-login" onClick={() => !loading && setForgotPassword(false)}>
              ← Back to Login
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
