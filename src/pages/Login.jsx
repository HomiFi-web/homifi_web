import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Assuming this CSS file handles the styling

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">Login As</div>
        <div className="button-group">
          <button
            onClick={() => navigate('/user-login')}
            className="role-button user"
          >
            User Login
          </button>
          <button
            onClick={() => navigate('/pg-owner-login')}
            className="role-button owner"
          >
            Owner Login
          </button>
          <button
            onClick={() => navigate('/admin-login')} // New Admin Login button
            className="role-button admin" // You might want to define 'admin' styles in Login.css
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;