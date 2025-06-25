// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { app } from './services/firebase'; // Keep this if you're using Firebase

// --- Import Global CSS ---
// Corrected path based on user's input: main.css is in 'src/pages'
import './pages/main.css'; 

// --- Import Pages ---
import Login from './pages/Login';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import PgOwnerLogin from './pages/PgOwnerLogin';
import GuestDashboard from './pages/GuestDashboard';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PgOwnerDashboard from './pages/PgOwnerDashboard';
import PgDetails from './pages/PgDetails';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard'; 

// --- Import Layout Components ---
import Header from './components/Header';
import Footer from './components/Footer';

// Main content component to handle route-based layout
const MainAppContent = () => {
  const location = useLocation();

  // List of routes where footer should be hidden (excluding user-dashboard now)
  const hideFooterRoutes = [
    '/pg-owner-dashboard',
    '/pg-details',
    '/admin-dashboard',
  ];

  // List of routes where header should be hidden
  const hideHeaderRoutes = [
    '/user-dashboard', // Added user-dashboard to hide header
    '/pg-owner-dashboard', // Assuming PG Owner dashboard also has its own header
    '/admin-dashboard', // Assuming Admin dashboard also has its own header
  ];

  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);
  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname); // New condition for header

  return (
    <div className="App">
      {!shouldHideHeader && <Header />} {/* Conditionally render Header */}

      <div className="content-wrapper">
        <Routes>
          <Route path="/" element={<Navigate to="/guest-dashboard" />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/pg-owner-login" element={<PgOwnerLogin />} />

          {/* Dashboard Routes */}
          <Route path="/guest-dashboard" element={<GuestDashboard />} />
          <Route path="/pg-owner-dashboard" element={<PgOwnerDashboard />} />
          <Route path="/pg-details/:pgId" element={<PgDetails />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/user-dashboard" element={<UserDashboard />} /> 

          {/* Info Pages */}
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />

          {/* Extras */}
          <Route path="/privacy-policy" element={<div>Privacy Policy Page</div>} />
          <Route path="/terms-of-service" element={<div>Terms of Service Page</div>} />
        </Routes>
      </div>

      {/* Footer appears on all pages except the ones listed above */}
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <MainAppContent />
    </Router>
  );
}

export default App;
