import React from 'react';
import './Header.css';
import logoImage from '../assets/logo.png'; // Make sure the path to your logo is correct

const Header = () => {
  return (
    <nav className="navbar"> {/* Added a specific class for easier targeting */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <img src={logoImage} alt="HomiFi Logo" className="logo-img mr-2" />
        </div>
        <div className="flex space-x-4">
          <a href="/">Home</a>
          <a href="/about">About Us</a>
          <a href="/contact">Contact Us</a>
          <a href="/login">Login</a>
        </div>
      </div>
    </nav>
  );
};

export default Header;