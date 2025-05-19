import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { app } from './services/firebase'; // Firebase setup if needed

// Import Pages
import Login from './pages/Login';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import PgOwnerLogin from './pages/PgOwnerLogin';
import GuestDashboard from './pages/GuestDashboard';  // Import GuestDashboard
import Header from './components/Header'; // Import the Header component

function App() {
  return (
    <Router>
      <div className="App">
        <Header /> {/* Place the Header here, outside of Routes */}
        <div className="content-wrapper"> {/* Optional container for page content */}
          <Routes>
            {/* Default route to Guest Dashboard */}
            <Route path="/" element={<Navigate to="/guest-dashboard" />} />

            {/* User authentication routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/user-login" element={<UserLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/pg-owner-login" element={<PgOwnerLogin />} />

            {/* Guest Dashboard route */}
            <Route path="/guest-dashboard" element={<GuestDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;