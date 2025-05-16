import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserLogin.css';

const UserLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    console.log('User logged in with:', email, password);
    alert('Login successful!');
    // You can add navigation to user dashboard here
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    console.log('Sending password reset email to:', email);
    alert('Password reset email sent! Please check your inbox.');
    setForgotPassword(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>User Login</h2>

        {!forgotPassword ? (
          <form onSubmit={handleSubmit}>
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
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="role-button user">Login</button>

            <p className="forgot-password" onClick={() => setForgotPassword(true)}>
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
            />
            {error && <p className="error-message">{error}</p>}
            <button type="button" className="role-button user" onClick={handleForgotPassword}>
              Send Reset Email
            </button>
            <p className="back-to-login" onClick={() => setForgotPassword(false)}>
              ← Back to Login
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserLogin;
