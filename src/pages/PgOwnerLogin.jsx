import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../services/firebase';
import './UserLogin.css'; // Reuse CSS

const PGOwnerSignup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    // Firebase signup logic
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log("User signed up:", user);
        alert("Signup successful!");
        // Navigate to PG Owner dashboard or login
        navigate('/pg-owner-login');
      })
      .catch((error) => {
        console.error("Signup error:", error.message);
        setError(error.message);
      });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>PG Owner Signup</h2>
        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="role-button owner">Sign Up</button>
          <p className="back-to-login" onClick={() => navigate('/')}>← Back to Login Page</p>
        </form>
      </div>
    </div>
  );
};

export default PGOwnerSignup;
