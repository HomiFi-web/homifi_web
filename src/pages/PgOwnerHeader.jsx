import React from 'react';
import { Link } from 'react-router-dom';
import homifiLogo from '../assets/logo.png'; // Assuming the logo path is correct
import './PgOwnerDashboard.css'; // Import the CSS for styling

const PgOwnerHeader = ({ onLogout }) => {
  return (
    <nav className="top-nav">
      <div className="top-nav-left">
        <img src={homifiLogo} alt="HomiFi Logo" className="top-nav-logo" />
        <h1 className="top-nav-title">PG Owner Dashboard</h1>
      </div>
      <div className="top-nav-menu">
        <Link to="#pg-details-form" className="top-nav-menu-item">Add/Edit PG</Link>
        <Link to="#owner-listings-section" className="top-nav-menu-item">My Listings</Link>
        <button onClick={onLogout} className="top-nav-logout-button">Logout</button>
      </div>
    </nav>
  );
};

export default PgOwnerHeader;