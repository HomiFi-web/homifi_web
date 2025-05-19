import React, { useState } from 'react';
import './GuestDashboard.css';


import Sidebar from '../components/Sidebar';
import RoomCard from '../components/RoomCard';


// Import hero background image and room images
import heroImage from '../assets/hero-background.jpg'; // Replace with your actual hero image
import room1Image from '../assets/room1.jpg';
import room2Image from '../assets/room2.jpg';

<div className="hero-section">
  <img src={heroImage} alt="Welcome to HomiFi" className="hero-background" />
  <div className="hero-content">
    <h1 className="hero-title">Welcome to HomiFi</h1>
    <p className="hero-tagline">Find your comfort zone</p>
  </div>
</div>

const GuestDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);


  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };


  const dummyRooms = [
    {
      name: 'Single Room AC',
      description: 'Includes bed, table, wifi...',
      image: room1Image,
      tag: 'Available',
      price: '₹10,000'
    },
    {
      name: 'Double Sharing Non-AC',
      description: 'Budget-friendly room for 2',
      image: room2Image,
      tag: 'Limited',
      price: '₹6,000'
    }
  ];


  return (
    <div className="guest-dashboard">
      <div className="hero-section">
        <img src={heroImage} alt="Welcome to HomiFi" className="hero-background" />
        <div className="hero-content">
          <h1 className="hero-title">Welcome to HomiFi</h1>
          <p className="hero-tagline">Find your perfect comfort zone.</p> {/* Add your actual tagline here */}
        </div>
      </div>


      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">📍 PG Near Kristu Jayanti College, Kothanur Bengaluru</p>
          <div className="flex space-x-2">
            <button className="filter-button">⚙️ Filters</button>
            <button className="wishlist-button">❤️ Wishlist (0)</button>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyRooms.map((room, index) => (
            <RoomCard key={index} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
};


export default GuestDashboard;