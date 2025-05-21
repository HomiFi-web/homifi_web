import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './UserLogin.css';

const UserLogin = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- NEW STATE FOR PASSWORD RULES FEEDBACK ---
  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  // --- END NEW STATE ---

  // --- NEW HELPER FUNCTION FOR PASSWORD VALIDATION ---
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
  // --- END NEW HELPER FUNCTION ---


  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
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
      if (userDoc.exists()) {
        navigate('/guest-dashboard');
      } else {
        setError('User data not found.');
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
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

    // --- Validate password before sending to Firebase ---
    if (!validatePassword(password)) {
      setError('Password does not meet all requirements.');
      setLoading(false);
      return;
    }
    // --- End Validation ---

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { uid: user.uid, email: email, role: 'guest' });
      navigate('/guest-dashboard');
    } catch (error) {
      let errorMessage = 'Sign up failed.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email address is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        // This might still be thrown if Firebase has its own minimum length check
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setLoading(true);
    if (!email) {
      setError('Enter your email to reset password');
      setLoading(false);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset link sent to: ' + email);
      setForgotPassword(false);
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
    <div className="login-container">
      <div className="login-box">
        <h2>{isSignUp ? 'Sign Up' : forgotPassword ? 'Reset Password' : 'Login'}</h2>

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
              className="role-button user"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="back-to-login" onClick={() => setForgotPassword(false)}>
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

            {/* --- NEW: Password Rule Display --- */}
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
            {/* --- END NEW --- */}

            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="role-button user" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
            </button>

            {!isSignUp && (
              <p className="forgot-password" onClick={() => setForgotPassword(true)}>
                Forgot Password?
              </p>
            )}

            <p
              className="toggle-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setForgotPassword(false);
                setError('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setShowPasswordRules(false); // Hide rules when toggling
                setPasswordRules({ // Reset password rules state
                  minLength: false,
                  hasUpperCase: false,
                  hasLowerCase: false,
                  hasNumber: false,
                  hasSpecialChar: false,
                });
              }}
            >
              {isSignUp
                ? 'Already have an account? Login here →'
                : "Don't have an account? Sign up here →"}
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserLogin;