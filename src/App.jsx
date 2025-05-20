// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { app } from './services/firebase'; // Ensure this path is correct if you're using Firebase

// --- Import ALL your Page Components ---
import Login from './pages/Login';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import PgOwnerLogin from './pages/PgOwnerLogin';
import GuestDashboard from './pages/GuestDashboard';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';

// --- Import your Header and Footer Components ---
import Header from './components/Header';
import Footer from './components/Footer'; // <--- IMPORT THE FOOTER HERE

function App() {
  return (
    <Router>
      <div className="App">
        {/* The Header component appears on every page */}
        <Header />

        <div className="content-wrapper"> {/* Optional: A wrapper for your main content/pages */}
          <Routes>
            {/* Default/Landing Page Route */}
            <Route path="/" element={<Navigate to="/guest-dashboard" />} />

            {/* Authentication/Login Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/user-login" element={<UserLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/pg-owner-login" element={<PgOwnerLogin />} />

            {/* Dashboard Routes */}
            <Route path="/guest-dashboard" element={<GuestDashboard />} />
            {/* Add PgOwnerDashboard route if you have it */}
            {/* <Route path="/pg-owner-dashboard" element={<PgOwnerDashboard />} /> */}

            {/* Informational Pages */}
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />

            {/* Legal Pages (you'll need to create these components) */}
            <Route path="/privacy-policy" element={<div>Privacy Policy Page</div>} />
            <Route path="/terms-of-service" element={<div>Terms of Service Page</div>} />

          </Routes>
        </div>

        {/* The Footer component appears on every page */}
        <Footer /> {/* <--- RENDER THE FOOTER HERE */}
      </div>
    </Router>
  );
}

export default App;