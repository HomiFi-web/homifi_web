import React from 'react';
import { Link } from 'react-router-dom'; // <--- IMPORTANT: Import Link
import './Header.css'; // Make sure you have this CSS file
import logoImage from '../assets/logo.png'; // <--- Ensure this path is correct for your logo

const Header = () => {
  return (
    <nav className="navbar">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          {/* Logo links to the Home/Guest Dashboard */}
          <Link to="/" className="logo-link">
            <img src={logoImage} alt="HomiFi Logo" className="logo-img mr-2" />
          </Link>
          {/* Optional: Add "HomiFi" text next to the logo, also linked */}
          {/* <Link to="/" className="navbar-brand">HomiFi</Link> */}
        </div>
        <div className="flex space-x-4">
          {/* Navigation Links using Link component */}
          <Link to="/">Home</Link> {/* This will typically go to your main landing page, which is currently set to /guest-dashboard by your App.js */}
          <Link to="/about-us">About Us</Link> {/* Link to your About Us page */}
          <Link to="/contact">Contact Us</Link> {/* Link to your Contact Us page */}
          <Link to="/login">Login</Link> {/* Link to your main Login page */}
          {/* You might want to add links for dashboards if they are directly accessible from the header,
              or they might be accessed after login. */}
          {/* <Link to="/guest-dashboard">Guest Dashboard</Link> */}
          {/* <Link to="/pg-owner-dashboard">PG Owner Dashboard</Link> */}
        </div>
      </div>
    </nav>
  );
};

export default Header;