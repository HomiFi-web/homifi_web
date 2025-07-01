import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  initializeApp,
  getApps,
  getApp
} from 'firebase/app';
import {
  getAuth
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc
} from 'firebase/firestore';

// IMPORTANT: Firebase configuration for your project
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


const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for show/hide password
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false); // State for reset password modal
  const [resetEmail, setResetEmail] = useState(''); // State for email in reset modal
  const [resetMessage, setResetMessage] = useState(''); // Message for reset modal

  const navigate = useNavigate();

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

      // Check if the user is an admin by looking up their UID in a 'admins' collection
      const adminDocRef = doc(db, 'admins', user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists() && adminDocSnap.data().role === 'admin') { // Assuming a 'role' field
        console.log('Admin login successful for UID:', user.uid);
        navigate('/admin-dashboard'); // Navigate to Admin Dashboard
      } else {
        await auth.signOut(); // Sign out non-admin users
        setError('Access Denied: You do not have administrator privileges.');
        console.log('Login failed: User is not an admin:', user.uid);
      }

    } catch (firebaseError) {
      console.error("Firebase Login Error:", firebaseError);
      let errorMessage = 'Login failed.'; // Declare errorMessage here
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Your account has been disabled.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        default:
          errorMessage = `Login failed: ${firebaseError.message}`;
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowResetPasswordModal(true);
    setResetEmail(email); // Pre-fill with current email
    setResetMessage('');
    setError(''); // Clear main error message
  };

  const sendResetPasswordEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage('');
    setError(''); // Clear any previous errors

    if (!resetEmail) {
      setResetMessage('Please enter your email to reset the password.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage(`Password reset email sent to ${resetEmail}. Please check your inbox.`);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      let errorMessage = "Failed to send password reset email.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No user found with this email.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      }
      setResetMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <style>
        {`
          /* AdminLogin.css - Embedded for Canvas compatibility (matching UserLogin.css) */

          /* HomiFi Color Palette */
          :root {
              --homifi-teal: #30D5C8;
              --homifi-dark-blue: #20143b;
              --homifi-darker-blue: #000069;
              --homifi-deepest-blue: #000040;

              --dark-text: #333333;
              --medium-text: #555555;
              --light-text: #777777;
              --border-light: #e0e0e0;
              --border-subtle: #eeeeee;

              --clean-white: #ffffff;
              --soft-light-grey: #f8f9fa;
              --very-light-blue-teal: #e0f7fa;

              --success-green: #28a745;
              --error-red: #dc3545;
              --warning-orange: #ffc107;
          }

          body {
              font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }

          .admin-login-container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: var(--homifi-dark-blue); /* Overall page background */
              padding: 20px;
              box-sizing: border-box;
          }

          .login-card { /* Renamed from login-box to login-card for consistency with previous AdminLogin.css */
              background-color: var(--clean-white); /* Inner box remains white */
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(32, 20, 59, 0.1); /* Shadow using HomiFi Dark Blue */
              text-align: center;
              width: 100%;
              max-width: 400px; /* Matching UserLogin.css max-width */
              box-sizing: border-box;
              border: 1px solid var(--border-light);
          }

          .login-card h2 {
              margin-bottom: 25px;
              color: var(--homifi-dark-blue); /* Heading text */
              font-size: 1.8em;
              font-weight: 700;
          }

          .input-group {
              margin-bottom: 15px;
              position: relative; /* For error messages and password toggle */
          }

          .login-card input[type="email"],
          .login-card input[type="password"],
          .login-card input[type="text"] {
              width: 100%; /* Changed from calc(100% - 24px) for consistency */
              padding: 12px;
              border: 1px solid var(--border-light);
              border-radius: 8px; /* Slightly more rounded inputs */
              font-size: 1em;
              box-sizing: border-box;
              background-color: var(--soft-light-grey); /* Light grey input background */
              color: var(--dark-text); /* Input text color */
              transition: border-color 0.3s ease, box-shadow 0.3s ease;
          }

          .login-card input[type="email"]::placeholder,
          .login-card input[type="password"]::placeholder,
          .login-card input[type="text"]::placeholder {
              color: var(--medium-text);
          }

          .login-card input[type="email"]:focus,
          .login-card input[type="password"]:focus,
          .login-card input[type="text"]:focus {
              border-color: var(--homifi-teal); /* Focus border changed to HomiFi Teal */
              outline: none;
              box-shadow: 0 0 0 3px rgba(48, 213, 200, 0.25); /* Shadow changed to match HomiFi Teal */
          }

          /* New styles for password input group and toggle */
          .password-input-group {
              position: relative;
              display: flex;
              align-items: center;
          }

          .password-input-group input {
              flex-grow: 1;
              padding-right: 40px; /* Make space for the toggle */
          }

          .show-password-toggle {
              position: absolute;
              right: 12px;
              cursor: pointer;
              font-size: 0.9em;
              color: var(--homifi-dark-blue); /* Match text color */
              font-weight: 500;
              user-select: none;
              padding: 2px 5px;
              border-radius: 3px;
              transition: color 0.2s ease;
          }

          .show-password-toggle:hover {
              color: var(--homifi-darker-blue); /* Darker shade on hover */
              text-decoration: underline;
          }

          .login-button {
              width: 100%;
              padding: 14px;
              border: none;
              border-radius: 8px; /* Slightly more rounded buttons */
              font-size: 1.1em;
              cursor: pointer;
              transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
              margin-top: 20px; /* More space above button */
              background: linear-gradient(135deg, var(--homifi-teal) 0%, var(--homifi-dark-blue) 100%); /* Teal to Dark Blue gradient */
              color: var(--clean-white); /* White text */
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }

          .login-button:hover:not(:disabled) {
              background: linear-gradient(135deg, #27c2b6 0%, #170e28 100%); /* Darker shades on hover */
              transform: translateY(-2px);
              box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
          }

          .login-button:disabled {
              background-color: var(--border-light);
              color: var(--light-text);
              cursor: not-allowed;
              transform: none;
              box-shadow: none;
          }

          .error-message {
              color: var(--error-red);
              margin-top: 5px; /* Closer to the input */
              margin-bottom: 10px; /* Space before next element */
              font-size: 0.85em;
              text-align: left; /* Align with input fields */
              padding-left: 5px; /* Small indent */
          }

          .success-message {
              color: var(--success-green);
              margin-top: 10px;
              margin-bottom: 15px;
              font-size: 0.95em;
          }

          .forgot-password,
          .toggle-link {
              margin-top: 20px;
              font-size: 0.9em;
              color: var(--homifi-dark-blue); /* Link text */
              cursor: pointer;
              transition: color 0.2s ease, text-decoration 0.2s ease;
          }

          .forgot-password:hover,
          .toggle-link:hover {
              text-decoration: underline;
              color: var(--homifi-teal); /* Teal on hover */
          }

          .back-to-main-login {
              margin-top: 15px;
              font-size: 0.9em;
              color: var(--medium-text); /* Muted color for this specific link */
              cursor: pointer;
              transition: color 0.2s ease;
          }

          .back-to-main-login:hover {
              color: var(--dark-text);
              text-decoration: underline;
          }

          /* Modal Styles */
          .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(0, 0, 0, 0.6);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1000;
              backdrop-filter: blur(4px);
          }

          .modal-content {
              background-color: var(--clean-white);
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
              width: 90%;
              max-width: 450px;
              position: relative;
              animation: fadeInScale 0.3s ease-out;
          }

          @keyframes fadeInScale {
              from {
                  opacity: 0;
                  transform: scale(0.9);
              }
              to {
                  opacity: 1;
                  transform: scale(1);
              }
          }

          .modal-close-button {
              position: absolute;
              top: 15px;
              right: 15px;
              background: none;
              border: none;
              font-size: 2em;
              cursor: pointer;
              color: var(--medium-text);
              transition: color 0.2s ease;
          }

          .modal-close-button:hover {
              color: var(--dark-text);
          }

          .modal-content h3 {
              margin-top: 0;
              margin-bottom: 25px;
              color: var(--dark-text);
              font-size: 1.8em;
              text-align: center;
          }

          .info-message {
              color: var(--success-green);
              margin-top: 15px;
              font-size: 0.9em;
              text-align: center;
          }

          /* Responsive Design */
          @media (max-width: 600px) {
              .login-card {
                  padding: 30px 25px;
                  margin: 20px;
              }
              .login-card h2 {
                  font-size: 1.6em;
                  margin-bottom: 20px;
              }
              .login-card input, .login-button {
                  padding: 10px;
                  font-size: 0.9em;
              }
          }
        `}
      </style>
      <div className="login-card">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
            />
            {error && email && !email.includes('@') && <p className="error-message">Invalid email format.</p>}
          </div>
          <div className="input-group password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
            />
            <span
              className="show-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging In...' : 'Login'}
          </button>
          <p className="forgot-password" onClick={() => { handleForgotPassword(); }}>
            Forgot Password?
          </p>
          <p
            className="back-to-main-login"
            onClick={() => navigate('/login')}
          >
            ← Back to Main Login Page
          </p>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showResetPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setShowResetPasswordModal(false)}>&times;</button>
            <h3>Reset Password</h3>
            <form onSubmit={sendResetPasswordEmail}>
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              {resetMessage && <p className="info-message">{resetMessage}</p>}
              <button type="submit" disabled={loading} className="login-button">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="toggle-link" onClick={() => setShowResetPasswordModal(false)}>
                ← Back to Login
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
