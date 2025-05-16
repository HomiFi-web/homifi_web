import React from 'react';
import { FaHome, FaShoppingCart, FaInfoCircle, FaPhone, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // <-- Import useNavigate
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate(); // <-- useNavigate hook

  const handleBookingClick = () => {
  navigate('/'); // Navigate to login page
  if (onClose) onClose(); // Only call onClose if it's passed


  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="logo">🏠 HomiFi</div>
      <ul>
        <li><FaHome /> Home</li>
        <li onClick={handleBookingClick}><FaShoppingCart /> Booking</li> {/* Navigate on click */}
        <li><FaInfoCircle /> About Us</li>
        <li><FaPhone /> Contact Us</li>
        <li><FaLock /> Privacy Policy</li>
        <li><FaLock /> Terms and Conditions</li>
        <li><FaLock /> Refunds Policy</li>
      </ul>
    </div>
  );
};

export default Sidebar;
