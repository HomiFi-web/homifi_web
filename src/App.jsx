import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { app } from './services/firebase'; // Ensure this path is correct if you're using Firebase

// --- Import ALL your Page Components here ---
import Login from './pages/Login';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import PgOwnerLogin from './pages/PgOwnerLogin'; // Corrected path
import GuestDashboard from './pages/GuestDashboard';
import AboutUs from './pages/AboutUs';    // <--- IMPORTANT: Import AboutUs
import ContactUs from './pages/ContactUs'; // <--- IMPORTANT: Import ContactUs

// --- Import your Header Component ---
import Header from './components/Header'; // Ensure this path is correct

function App() {
  return (
    <Router>
      <div className="App">
        {/* The Header component is placed OUTSIDE the <Routes>
            so it appears on every page that the router renders. */}
        <Header />

        <div className="content-wrapper"> {/* Optional: A wrapper for your main content/pages */}
          <Routes>
            {/* --- Define ALL your Routes here --- */}

            {/* Default/Landing Page Route */}
            {/* This makes '/' redirect to '/guest-dashboard' */}
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
            <Route path="/about-us" element={<AboutUs />} />      {/* <--- ROUTE for About Us */}
            <Route path="/contact" element={<ContactUs />} />    {/* <--- ROUTE for Contact Us */}

            {/* You can add a 404 Not Found route here if desired */}
            {/* <Route path="*" element={<div>404 Page Not Found</div>} /> */}

          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;