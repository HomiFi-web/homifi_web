// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // Make sure you create this CSS file
import logoImage from '../assets/logo.png'; // Path to your HomiFi logo

// Import icons (you might need to install a library like react-icons or use SVG/image assets)
// For example, if using react-icons:
// npm install react-icons
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section brand-info">
          <Link to="/" className="footer-logo-link">
            <img src={logoImage} alt="HomiFi Logo" className="footer-logo" />
            <span className="footer-brand-name">HomiFi</span>
          </Link>
          <p className="footer-tagline">Find your perfect comfort zone.</p>
          <p className="footer-description">
            Your trusted partner in finding and managing paying guest accommodations.
            Connecting you to your ideal living space with ease.
          </p>
        </div>

        <div className="footer-section footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about-us">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            {/* Add more links as needed, e.g., FAQ, Blog */}
            {/* <li><Link to="/faq">FAQ</Link></li> */}
          </ul>
        </div>

        <div className="footer-section footer-contact">
          <h3>Contact Us</h3>
          <p>
            Phone: <a href="tel:+916366049251">6366049251</a> / <a href="tel:+919019844260">9019844260</a>
          </p>
          <p>
            Email: <a href="mailto:homifi7@gmail.com">homifi7@gmail.com</a>
          </p>
          <p>HomiFi Headquarters, Kristu Jayanti College, Bengaluru, Karnataka, 560077</p>
          <div className="social-links">
            {/* Replace with your actual social media URLs */}
            <a href="https://facebook.com/homifi" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF /></a>
            <a href="https://twitter.com/homifi" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
            <a href="https://instagram.com/homifi" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
            <a href="https://linkedin.com/company/homifi" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedinIn /></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} HomiFi. All rights reserved.</p>
        {/*<div className="footer-legal-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-service">Terms of Service</Link>
        </div>*/}
      </div>
    </footer>
  );
};

export default Footer;