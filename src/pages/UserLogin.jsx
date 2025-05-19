import React, { useState } from 'react';
import './UserLogin.css';

const UserLogin = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('All fields required');
    alert(`Logged in as: ${email}`);
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('All fields required');
    alert(`Signed up with: ${email}`);
  };

  const handleForgotPassword = () => {
    if (!email) return setError('Enter your email to reset password');
    alert('Password reset link sent to: ' + email);
    setForgotPassword(false);
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
              onChange={e => setEmail(e.target.value)}
              required
            />
            {error && <p className="error-message">{error}</p>}
            <button
              type="button"
              className="role-button user"
              onClick={handleForgotPassword}
            >
              Send Reset Link
            </button>
            <p className="back-to-login" onClick={() => setForgotPassword(false)}>
              ← Back to Login
            </p>
          </div>
        ) : (
          <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="role-button user">
              {isSignUp ? 'Sign Up' : 'Login'}
            </button>

            {!isSignUp && (
              <p className="forgot-password" onClick={() => setForgotPassword(true)}>
                Forgot Password?
              </p>
            )}

            <p className="toggle-link" onClick={() => {
              setIsSignUp(!isSignUp);
              setForgotPassword(false);
              setError('');
            }}>
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
