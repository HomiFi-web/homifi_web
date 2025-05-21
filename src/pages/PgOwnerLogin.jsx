import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import './PGOwnerLogin.css';

const PGOwnerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        return Object.values(rules).every(Boolean);
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
      if (userDoc.exists() && userDoc.data().role === 'owner') { // Check the role here
        navigate('/pg-owner-dashboard'); // Corrected navigation path
      } else {
        setError('Invalid credentials.  Are you sure you are a PG Owner?');
        setLoading(false);
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
      setLoading(false);
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
        <h2>PG Owner Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
            onFocus={() => setShowPasswordRules(true)}
            onBlur={() => {
                if(password === ""){
                    setShowPasswordRules(false);
                }
            }}
            required
          />
           {/* --- NEW: Password Rule Display --- */}
           {showPasswordRules && (
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
          <button type="submit" className="role-button owner" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
           <p className="forgot-password" onClick={() => setForgotPassword(true)}>
              Forgot Password?
            </p>
          <p className="back-to-login" onClick={() => navigate('/')}>
            ← Back to Login Page
          </p>
        </form>
      </div>
    </div>
  );
};

export default PGOwnerLogin;