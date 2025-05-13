import React from 'react';
import './login.css'; // Import CSS for styling

function Login({ onButtonClick }) {
  return (
    <div className="login-container">
      <h2 className="login-header">Welcome to HomiFi</h2>
      <p>Please select your login type</p>
      <button onClick={() => onButtonClick('user')} className="login-button">User</button>
      <button onClick={() => onButtonClick('admin')} className="login-button">Admin</button>
      <button onClick={() => onButtonClick('pgOwner')} className="login-button">PG Owner</button>
    </div>
  );
}

export default Login;
