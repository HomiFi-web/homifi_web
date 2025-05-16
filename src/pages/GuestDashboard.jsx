import React, { useState } from 'react';
import './GuestDashboard.css';
import promoBanner from '../assets/promo-banner.jpg'; // Ensure the image exists in /src/assets

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import RoomCard from '../components/RoomCard';

const GuestDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const dummyRooms = [
    {
      name: 'Single Room AC',
      description: 'Includes bed, table, wifi...',
      image: '/room1.jpg',
    },
    {
      name: 'Double Sharing Non-AC',
      description: 'Budget-friendly room for 2',
      image: '/room2.jpg',
    }
  ];

  return (
    <div>
      {/* Promo Banner */}
      <div className="promo-banner">
        <img src={promoBanner} alt="Promo Banner" />
      </div>

      {/* Sidebar Toggle Button */}
      {!isSidebarOpen && (
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          ☰
        </button>
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className={`content ${isSidebarOpen ? 'shifted' : ''}`}>
        {/* Optional Close Button inside content when sidebar is open */}
        {isSidebarOpen && (
          <button className="sidebar-toggle close-btn" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        )}

        <Header />

        {/* Filters and Wishlist */}
        <div className="top-actions">
          <button className="action-btn">
            <span>⚙️</span> Filters
          </button>
          <button className="action-btn wishlist">
            <span>❤️</span> Wishlist (0)
          </button>
        </div>

        {/* Room Listings */}
        <div className="room-list">
          {dummyRooms.map((room, i) => (
            <RoomCard key={i} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
