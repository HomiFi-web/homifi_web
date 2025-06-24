import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Removed external CSS imports to resolve "Could not resolve" errors
// import '../App.css'; 
// import './AdminLogin.css'; 

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
  const [showPassword, setShowPassword] = useState(false); // New state for show/hide password
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false); // State for reset password modal
  const [resetEmail, setResetEmail] = useState(''); // State for email in reset modal
  const [resetMessage, setResetMessage] = useState(''); // Message for reset modal

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Logic for handling authenticated users if needed on login page.
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

      console.log("Authenticated User UID:", user.uid);

      const adminDocRef = doc(db, 'admins', user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        console.log('Admin login successful for UID:', user.uid);
        navigate('/admin-dashboard');
      } else {
        await auth.signOut();
        setError('Access Denied: You do not have administrator privileges.');
        console.log('Login failed: User is not an admin:', user.uid);
      }

    } catch (firebaseError) {
      console.error("Firebase Login Error:", firebaseError);
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        case 'auth/user-disabled':
          setError('Your account has-been disabled.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        default:
          setError(`Login failed: ${firebaseError.message}`);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowResetPasswordModal(true);
    setResetEmail(email); // Pre-fill with current email
    setResetMessage('');
  };

  const sendResetPasswordEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage('');
    setError('');

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
      setError(errorMessage); // Also set general error if desired
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <style>{`
        /* General styles from App.css (simplified for login context) */
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            background-color: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        /* Specific styles for AdminLogin */
        .admin-login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh; /* Ensure it takes full viewport height */
            width: 100%;
        }

        .login-card {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
            width: 100%;
            max-width: 400px;
            text-align: center;
            transition: all 0.3s ease-in-out;
            border: 1px solid #e0e0e0;
        }

        .login-card:hover {
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
            transform: translateY(-2px);
        }

        .login-card h2 {
            margin-bottom: 30px;
            color: #2c3e50;
            font-size: 2.2em;
            font-weight: 700;
        }

        .form-group {
            margin-bottom: 20px;
            text-align: left;
            position: relative; /* For password toggle */
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 600;
            font-size: 0.95em;
        }

        .form-input {
            width: calc(100% - 20px); /* Adjust for padding */
            padding: 12px 10px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 1em;
            box-sizing: border-box; /* Include padding in width */
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-input:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
            outline: none;
        }

        .password-input-wrapper {
            position: relative;
            width: 100%;
        }

        .password-input-wrapper .form-input {
            padding-right: 40px; /* Make space for the toggle icon */
        }

        .toggle-password {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            font-size: 1.2em; /* Adjust emoji size */
            z-index: 10;
        }

        .login-button {
            background-color: #007bff;
            color: white;
            padding: 14px 25px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: 600;
            width: 100%;
            transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
            margin-top: 20px;
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
        }

        .login-button:hover {
            background-color: #0056b3;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 123, 255, 0.3);
        }

        .login-button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .forgot-password-button {
            background: none;
            border: none;
            color: #007bff;
            font-size: 0.9em;
            margin-top: 15px;
            cursor: pointer;
            text-decoration: underline;
            transition: color 0.2s ease;
        }

        .forgot-password-button:hover {
            color: #0056b3;
        }

        .error-message {
            color: #dc3545;
            margin-top: 15px;
            font-size: 0.9em;
            text-align: center;
        }

        .info-message {
            color: #28a745;
            margin-top: 15px;
            font-size: 0.9em;
            text-align: center;
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
            background-color: #ffffff;
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
            color: #888;
            transition: color 0.2s ease;
        }

        .modal-close-button:hover {
            color: #333;
        }

        .modal-content h3 {
            margin-top: 0;
            margin-bottom: 25px;
            color: #2c3e50;
            font-size: 1.8em;
            text-align: center;
        }

        /* Responsive Adjustments */
        @media (max-width: 600px) {
            .login-card {
                padding: 30px 20px;
                margin: 20px;
            }
            .form-input {
                width: calc(100% - 20px);
            }
            .login-card h2 {
                font-size: 1.8em;
            }
        }
      `}</style>
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                role="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging In...' : 'Login'}
          </button>
          <button type="button" onClick={handleForgotPassword} className="forgot-password-button">
            Forgot Password?
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showResetPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setShowResetPasswordModal(false)}>&times;</button>
            <h3>Reset Password</h3>
            <form onSubmit={sendResetPasswordEmail}>
              <div className="form-group">
                <label htmlFor="resetEmail">Enter your email:</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="admin@example.com"
                />
              </div>
              {resetMessage && <p className="info-message">{resetMessage}</p>}
              <button type="submit" disabled={loading} className="login-button">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              {/* Added "Back to Login" button */}
              <button
                type="button"
                onClick={() => setShowResetPasswordModal(false)}
                className="forgot-password-button" // Reusing styling for consistency
                style={{ marginTop: '15px', textDecoration: 'none' }} // Override underline and add top margin
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
