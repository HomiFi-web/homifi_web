import React, { useState } from 'react';
import './UserLogin.css'; // Import the new UserLogin CSS

const UserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false); // New state for forgot password

  // Simulate form submission without Firebase
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    // Simulate successful login
    console.log('User logged in with:', email, password);
    alert('Login successful!');
    // Redirect to user dashboard or homepage (you can implement this later)
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    // Simulate sending a password reset email
    console.log('Sending password reset email to:', email);
    alert('Password reset email sent! Please check your inbox.');
    setForgotPassword(false); // Close the forgot password form
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
              Back to Login
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserLogin;
