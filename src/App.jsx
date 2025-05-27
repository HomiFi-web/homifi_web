import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { app } from './services/firebase'; // Ensure this path is correct if you're using Firebase

// --- Import ALL your Page Components ---
import Login from './pages/Login';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import PgOwnerLogin from './pages/PgOwnerLogin';
import GuestDashboard from './pages/GuestDashboard';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PgOwnerDashboard from './pages/PgOwnerDashboard';
import PgDetails from './pages/PgDetails'; // Import the new PgDetails component


// --- Import your Header and Footer Components ---
import Header from './components/Header';
import Footer from './components/Footer';

// New component to wrap content that uses useLocation
const MainAppContent = () => {
  const location = useLocation();

  // Define an array of routes where you want to hide the footer
  const hideFooterRoutes = ['/pg-owner-dashboard', '/pg-details']; // Added /pg-details here

  // Check if the current route is in the array of routes where the footer should be hidden
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);

  // --- DEBUGGING LOGS (Optional, remove after debugging) ---
  console.log('Current Pathname:', location.pathname);
  console.log('Hide Footer Routes:', hideFooterRoutes);
  console.log('Should Hide Footer:', shouldHideFooter);
  // --- END DEBUGGING LOGS ---

  return (
    <div className="App">
      {/* The Header component appears on every page */}
      <Header />

      <div className="content-wrapper">
        {/* Optional: A wrapper for your main content/pages */}
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
          <Route path="/pg-owner-dashboard" element={<PgOwnerDashboard />} />
          <Route path="/pg-details" element={<PgDetails />} /> {/* New route for PG Details */}

          {/* Informational Pages */}
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />

          {/* Legal Pages (you'll need to create these components) */}
          <Route path="/privacy-policy" element={<div>Privacy Policy Page</div>} />
          <Route path="/terms-of-service" element={<div>Terms of Service Page</div>} />
        </Routes>
      </div>

      {/* The Footer component appears conditionally */}
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
