import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase'; // Corrected path: assuming PGOwnerLogin.jsx is in src/pages/
import './PGOwnerLogin.css'; // Correct path: PGOwnerLogin.css should be in the same directory as PGOwnerLogin.jsx

const PGOwnerLogin = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false); // State to toggle between login and signup
  const [email, setEmail] = useState('');
  const [useStatePassword, setUseStatePassword] = useState(''); // Renamed to avoid conflict with validatePassword internal var
  const [confirmPassword, setConfirmPassword] = useState(''); // For signup
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false); // State for forgot password flow
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // For showing success messages
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

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

    if (!email || !useStatePassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, useStatePassword);
      const user = userCredential.user;

      // CRITICAL FIX: Check role in 'pg_owners' collection
      const pgOwnerRef = doc(db, 'pg_owners', user.uid);
      const pgOwnerDoc = await getDoc(pgOwnerRef);

      if (pgOwnerDoc.exists() && pgOwnerDoc.data().role === 'owner') {
        navigate('/pg-owner-dashboard'); // Navigate to PG Owner Dashboard
      } else {
        setError('Invalid credentials or unauthorized role. Please check your email and password.');
        // Optional: If user exists in Auth but not in pg_owners, sign them out.
        // await auth.signOut();
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

    if (!email || !useStatePassword || !confirmPassword) {
      setError('All fields required.');
      setLoading(false);
      return;
    }

    if (useStatePassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!validatePassword(useStatePassword)) {
      setError('Password does not meet all requirements.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, useStatePassword);
      const user = userCredential.user;

      // CRITICAL FIX: Store user role in 'pg_owners' collection
      await setDoc(doc(db, 'pg_owners', user.uid), {
        email: user.email,
        role: 'owner', // Explicitly set role to 'owner'
        createdAt: new Date(),
        // You can add more fields here relevant to a PG owner profile
      });

      setSuccessMessage('Account created successfully! Please log in.');
      setIsSignUp(false); // Switch back to login form
      setEmail(''); // Clear email field
      setUseStatePassword(''); // Clear password field
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
    // Corrected className to match CSS: pg-owner-login-container -> login-container
    <div className="login-container">
      {/* Corrected className to match CSS: pg-owner-login-box -> login-box */}
      <div className="login-box">
        <h2>
          {isSignUp ? 'PG Owner Sign Up' : forgotPassword ? 'Reset Password' : 'PG Owner Login'}
        </h2>

        {successMessage && <p className="success-message">{successMessage}</p>}
        {error && !successMessage && <p className="error-message">{error}</p>} {/* Display error only if no success message */}

        {forgotPassword ? (
          <div className="forgot-password-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {/* Corrected className to match CSS: pg-owner-button -> role-button user */}
            <button
              type="button"
              className="role-button user"
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
            {/* Password input with show/hide toggle */}
            <div className="input-group password-input-group"> {/* Added a class for styling the container */}
              <input
                type={showPassword ? 'text' : 'password'} // Dynamically change type
                placeholder="Password"
                value={useStatePassword}
                onChange={(e) => {
                  setUseStatePassword(e.target.value);
                  if (isSignUp) { // Only validate rules in sign-up mode
                    validatePassword(e.target.value);
                  }
                }}
                onFocus={() => { if (isSignUp) setShowPasswordRules(true); }} // Show rules on focus
                onBlur={() => {
                  if (isSignUp && useStatePassword === '') {
                    setShowPasswordRules(false);
                  }
                }}
                required
              />
              <span
                className="show-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </div>
            {isSignUp && (
              <div className="input-group password-input-group"> {/* Added a class for styling the container */}
                <input
                  type={showPassword ? 'text' : 'password'} // Dynamically change type
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <span
                  className="show-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </span>
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

            {/* Corrected className to match CSS: pg-owner-button -> role-button user */}
            <button type="submit" className="role-button user" disabled={loading}>
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
                setUseStatePassword(''); // Clear password field
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
              onClick={() => navigate('/login')} // Navigate back to the main login route
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
