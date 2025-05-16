import React from 'react';
import './Header.css';

const Header = () => (
  <div className="header">
    <img src="/logo.png" alt="logo" className="logo-img" />
    <p className="location">📍 PG Near Kristu Jayanti College, Kothanur Bengaluru</p>
    <div className="banner">
      <img src="/banner.jpg" alt="banner" />
      <p className="banner-text">Affordable and Convenient PG Options...</p>
    </div>
  </div>
);

export default Header;
