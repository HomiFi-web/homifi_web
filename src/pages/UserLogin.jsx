import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
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
  setDoc,
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


const UserLogin = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false); // State to toggle between login and signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // For signup
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false); // State for forgot password flow
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // For showing success messages
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  // --- Password Rules Feedback ---
  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    maxLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  // --- End Password Rules Feedback ---

  // --- Helper Function for Password Validation ---
  const validatePassword = (pwd) => {
    const minLength = 5; // Changed to 5 as per request
    const maxLength = 10; // Added max length as per request
    const rules = {
      minLength: pwd.length >= minLength,
      maxLength: pwd.length <= maxLength,
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

      // Check if user exists in the 'users' collection
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && userDocSnap.data().role === 'user') { // Assuming a 'role' field
        setSuccessMessage('Login successful!');
        navigate('/user-dashboard'); // Navigate to User Dashboard
      } else {
        setError('Invalid credentials or unauthorized role. Please check your email and password.');
        await auth.signOut(); // Sign out if not a recognized user
      }

    } catch (error) {
      let errorMessage = 'Login failed.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Your account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        default:
          errorMessage = `Login failed: ${error.message}`;
          break;
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
      setError('All fields are required.');
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

      // Store user data in Firestore (e.g., 'users' collection)
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'user', // Assign a default role for regular users
        createdAt: new Date(),
      });

      setSuccessMessage('Account created successfully! Please log in.');
      setIsSignUp(false); // Switch back to login form
      setEmail(''); // Clear form fields
      setPassword('');
      setConfirmPassword('');
      setShowPasswordRules(false); // Hide rules
      setPasswordRules({ // Reset password rules state
        minLength: false, maxLength: false, hasUpperCase: false, hasLowerCase: false,
        hasNumber: false, hasSpecialChar: false,
      });

    } catch (error) {
      let errorMessage = 'Sign up failed.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        default:
          errorMessage = `Sign up failed: ${error.message}`;
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Forgot Password Function ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset link sent to: ' + email);
      setForgotPassword(false); // Go back to login form after sending link
      setEmail(''); // Clear email field after sending
    } catch (error) {
      let errorMessage = 'Failed to send reset email.';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        default:
          errorMessage = `Failed to send reset email: ${error.message}`;
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style>
        {`
          /* UserLogin.css - Embedded for Canvas compatibility */

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

          .login-container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: var(--homifi-dark-blue); /* Overall page background */
              padding: 20px;
              box-sizing: border-box;
          }

          .login-box {
              background-color: var(--clean-white); /* Inner box remains white */
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(32, 20, 59, 0.1); /* Shadow using HomiFi Dark Blue */
              text-align: center;
              width: 100%;
              max-width: 400px;
              box-sizing: border-box;
              border: 1px solid var(--border-light);
          }

          .login-box h2 {
              margin-bottom: 25px;
              color: var(--homifi-dark-blue); /* Heading text */
              font-size: 1.8em;
              font-weight: 700;
          }

          .input-group {
              margin-bottom: 15px;
              position: relative; /* For error messages and password toggle */
          }

          .login-box input[type="email"],
          .login-box input[type="password"],
          .login-box input[type="text"] {
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

          .login-box input[type="email"]::placeholder,
          .login-box input[type="password"]::placeholder,
          .login-box input[type="text"]::placeholder {
              color: var(--medium-text);
          }

          .login-box input[type="email"]:focus,
          .login-box input[type="password"]:focus,
          .login-box input[type="text"]:focus {
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

          .password-rules {
              list-style: none;
              padding: 0;
              margin: 5px 0 15px 0; /* Adjust margin to be closer to password input */
              text-align: left;
              font-size: 0.8em;
              color: var(--dark-text); /* Password rules text */
              background-color: var(--soft-light-grey); /* Subtle background for rules */
              border-radius: 8px;
              padding: 10px 15px;
              border: 1px solid var(--border-subtle);
          }

          .password-rules li {
              margin-bottom: 3px;
              display: flex;
              align-items: center;
          }

          .password-rules li::before {
              content: '✖';
              color: var(--error-red);
              margin-right: 8px;
              font-weight: bold;
              font-size: 1.1em;
          }

          .password-rules li.valid::before {
              content: '✔';
              color: var(--success-green);
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

          /* Responsive Design */
          @media (max-width: 600px) {
              .login-box {
                  padding: 30px 25px;
                  margin: 20px;
              }
              .login-box h2 {
                  font-size: 1.6em;
                  margin-bottom: 20px;
              }
              .login-box input, .login-button {
                  padding: 10px;
                  font-size: 0.9em;
              }
              .password-rules {
                  padding: 8px 10px;
                  font-size: 0.75em;
              }
          }
        `}
      </style>
      <div className="login-box">
        <h2>
          {isSignUp ? 'User Sign Up' : forgotPassword ? 'Reset Password' : 'User Login'}
        </h2>

        {successMessage && <p className="success-message">{successMessage}</p>}

        {forgotPassword ? (
          <form onSubmit={handleForgotPassword}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
              {error && <p className="error-message">{error}</p>}
            </div>
            <button
              type="submit"
              className="login-button"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="toggle-link" onClick={() => { setForgotPassword(false); setError(''); setSuccessMessage(''); setEmail(''); }}>
              ← Back to Login
            </p>
          </form>
        ) : (
          <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
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
            {/* Password input with show/hide toggle */}
            <div className="input-group password-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (isSignUp) { // Only validate rules in sign-up mode
                    validatePassword(e.target.value);
                  }
                  setError('');
                }}
                onFocus={() => { if (isSignUp) setShowPasswordRules(true); }}
                onBlur={() => {
                  if (isSignUp && password === '') {
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
            {isSignUp && showPasswordRules && (
              <ul className="password-rules">
                <li className={passwordRules.minLength ? 'valid' : ''}>
                  Min 5 characters
                </li>
                <li className={passwordRules.maxLength ? 'valid' : ''}>
                  Max 10 characters
                </li>
                <li className={passwordRules.hasUpperCase ? 'valid' : ''}>
                  At least one uppercase letter (A-Z)
                </li>
                <li className={passwordRules.hasLowerCase ? 'valid' : ''}>
                  At least one lowercase letter (a-z)
                </li>
                <li className={passwordRules.hasNumber ? 'valid' : ''}>
                  At least one number (0-9)
                </li>
                <li className={passwordRules.hasSpecialChar ? 'valid' : ''}>
                  At least one special character (!@#$%^&*)
                </li>
              </ul>
            )}
            {isSignUp && (
              <div className="input-group password-input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
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

            {error && !successMessage && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button" disabled={loading}>
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
                setPassword(''); // Clear password field
                setConfirmPassword('');
                setShowPasswordRules(false); // Hide rules
                setPasswordRules({ // Reset password rules state
                  minLength: false, maxLength: false, hasUpperCase: false, hasLowerCase: false,
                  hasNumber: false, hasSpecialChar: false,
                });
              }}
            >
              {isSignUp
                ? 'Already have an account? Login here →'
                : "Don't have an account? Sign up here →"}
            </p>

            <p
              className="back-to-main-login" // New class for this specific link
              onClick={() => navigate('/login')}
            >
              ← Back to Main Login Page
            </p>

          </form>
        )}
      </div>
    </div>
  );
};

export default UserLogin;
