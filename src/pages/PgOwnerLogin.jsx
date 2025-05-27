import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase'; // Ensure this path is correct
import './PGOwnerLogin.css'; // We'll update/create this CSS file

const PGOwnerLogin = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false); // State to toggle between login and signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // For signup
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false); // State for forgot password flow
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // For showing success messages

  // --- Password Rules Feedback ---
  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  // --- End Password Rules Feedback ---

  // --- Helper Function for Password Validation ---
  const validatePassword = (pwd) => {
    const minLength = 8;
    const rules = {
      minLength: pwd.length >= minLength,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    };
    setPasswordRules(rules);
    return Object.values(rules).every(Boolean); // Returns true if all rules are met
  };
  // --- End Helper Function ---

  // --- Handle Login Function ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists() && userDoc.data().role === 'owner') {
        navigate('/pg-owner-dashboard'); // Navigate to PG Owner Dashboard
      } else {
        setError('Invalid credentials or unauthorized role. Please check your email and password.');
      }
    } catch (error) {
      let errorMessage = 'Login failed.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Sign Up Function ---
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email || !password || !confirmPassword) {
      setError('All fields required.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('Password does not meet all requirements.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user role as 'owner' in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'owner', // Explicitly set role to 'owner'
        createdAt: new Date(),
      });

      setSuccessMessage('Account created successfully! Please log in.');
      setIsSignUp(false); // Switch back to login form
      setEmail(''); // Clear email field
      setPassword(''); // Clear password field
      setConfirmPassword(''); // Clear confirm password field
      setShowPasswordRules(false); // Hide rules
      setPasswordRules({ // Reset password rules state
        minLength: false, hasUpperCase: false, hasLowerCase: false,
        hasNumber: false, hasSpecialChar: false,
      });
    } catch (error) {
      let errorMessage = 'Sign up failed.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Forgot Password Function ---
  const handleForgotPassword = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    if (!email) {
      setError('Enter your email to reset password');
      setLoading(false);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset link sent to: ' + email);
      setForgotPassword(false); // Go back to login form
    } catch (error) {
      let errorMessage = 'Failed to send reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'There is no user record corresponding to this email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pg-owner-login-container">
      <div className="pg-owner-login-box">
        <h2>
          {isSignUp ? 'PG Owner Sign Up' : forgotPassword ? 'Reset Password' : 'PG Owner Login'}
        </h2>

        {successMessage && <p className="success-message">{successMessage}</p>}

        {forgotPassword ? (
          <div className="forgot-password-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="error-message">{error}</p>}
            <button
              type="button"
              className="pg-owner-button"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="toggle-link" onClick={() => { setForgotPassword(false); setError(''); setSuccessMessage(''); }}>
              ← Back to Login
            </p>
          </div>
        ) : (
          <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (isSignUp) { // Only validate rules in sign-up mode
                    validatePassword(e.target.value);
                  }
                }}
                onFocus={() => { if (isSignUp) setShowPasswordRules(true); }} // Show rules on focus
                onBlur={() => {
                  // Only hide if password is empty AND all rules are not met
                  if (isSignUp && password === '') {
                    setShowPasswordRules(false);
                  }
                }}
                required
              />
            </div>
            {isSignUp && (
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {/* --- Password Rule Display (only for signup) --- */}
            {isSignUp && showPasswordRules && (
              <ul className="password-rules">
                <li className={passwordRules.minLength ? 'valid' : 'invalid'}>
                  At least 8 characters
                </li>
                <li className={passwordRules.hasUpperCase ? 'valid' : 'invalid'}>
                  At least one uppercase letter (A-Z)
                </li>
                <li className={passwordRules.hasLowerCase ? 'valid' : 'invalid'}>
                  At least one lowercase letter (a-z)
                </li>
                <li className={passwordRules.hasNumber ? 'valid' : 'invalid'}>
                  At least one number (0-9)
                </li>
                <li className={passwordRules.hasSpecialChar ? 'valid' : 'invalid'}>
                  At least one special character (!@#$%^&*)
                </li>
              </ul>
            )}
            {/* --- End Password Rule Display --- */}

            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="pg-owner-button" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
            </button>

            {!isSignUp && (
              <p className="forgot-password" onClick={() => { setForgotPassword(true); setError(''); setSuccessMessage(''); }}>
                Forgot Password?
              </p>
            )}

            <p
              className="toggle-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setForgotPassword(false); // Reset forgot password state
                setError(''); // Clear errors
                setSuccessMessage(''); // Clear success messages
                setEmail(''); // Clear form fields
                setPassword('');
                setConfirmPassword('');
                setShowPasswordRules(false); // Hide rules
                setPasswordRules({ // Reset password rules state
                  minLength: false, hasUpperCase: false, hasLowerCase: false,
                  hasNumber: false, hasSpecialChar: false,
                });
              }}
            >
              {isSignUp
                ? 'Already have an account? Login here →'
                : "Don't have an account? Sign up here →"}
            </p>

            {/* NEW: Back to Main Login Page (Login.jsx) link */}
            <p
              className="toggle-link" // Reusing the style for consistency
              onClick={() => navigate('/login')} // <<-- IMPORTANT: Change '/login' to your actual route for Login.jsx
              style={{ marginTop: '15px' }} // Add some spacing for better layout
            >
              ← Back to Login Page
            </p>

          </form>
        )}
      </div>
    </div>
  );
};

export default PGOwnerLogin;