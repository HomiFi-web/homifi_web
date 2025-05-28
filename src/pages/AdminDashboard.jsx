import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app'; // Added getApps, getApp
import { getAuth, signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth'; // Added sendPasswordResetEmail
import { getFirestore, collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import './AdminDashboard.css'; // Import AdminDashboard specific CSS

// Declare global variables for ESLint and provide fallback values
// These are typically injected by the Canvas environment, but hardcoding for local dev
const __initial_auth_token = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : '';
const __app_id = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pgListings, setPgListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPg, setSelectedPg] = useState(null); // State to hold PG details for viewing

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false); // New state for sidebar visibility

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [adminEmail, setAdminEmail] = useState(''); // State to store admin's email for profile
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Firebase Initialization and Auth
  useEffect(() => {
    try {
      // Hardcode Firebase config for local development
      const firebaseConfig = {
        apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A", // Your Web API Key
        authDomain: "homifi-bac92.firebaseapp.com", // Corrected domain
        projectId: "homifi-bac92", // Corrected project ID
        storageBucket: "homifi-bac92.appspot.com",
        messagingSenderId: "876737044340", // Your Project number
        appId: "1:876737044340:web:07d098db6f17f9c80bd621", // This is derived from Project Number and Web API Key
        // measurementId: "G-XXXXXXXXXX" // Optional: if you use Google Analytics for Firebase
      };
      
      // Initialize app only if it hasn't been initialized
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          setAdminEmail(user.email); // Set admin email from authenticated user
          // For Admin Dashboard, ideally you've already checked role on login page.
          // If direct navigation is possible, you'd add role check here too.
        } else {
          // In a production admin dashboard, you would typically redirect to login page
          // if no user is authenticated, rather than signing in anonymously/custom token.
          // This part of the code might be a remnant from a general dashboard template.
          // For a secure admin dashboard, remove anonymous/custom token sign-in here.
          if (__initial_auth_token) {
            await signInWithCustomToken(authInstance, __initial_auth_token);
          } else {
            // For a production admin dashboard, you'd navigate('/') here if not authenticated
            // await signInAnonymously(authInstance); // Remove for production admin dashboard
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      setError(`Failed to initialize the application: ${error.message}. Please try again.`);
    }
  }, []);

  // Fetch PG listings when Firebase is ready
  useEffect(() => {
    if (db && isAuthReady) {
      setLoading(true);
      // Ensure the appId is correctly derived or set
      const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-bac92'; // Use project ID as default if __app_id is not injected, or the correct value
      
      // Correct Firestore path for pg_listings
      // Assuming pg_listings are directly under the root or a specific collection, not artifacts/appId/public/data/pg_listings
      // If your PG listings are under artifacts/homifi-bac92/public/data/pg_listings, then keep the original path.
      // Based on your previous screenshots, 'pg_listings' is a root collection.
      const q = query(collection(db, 'pg_listings')); 

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPgListings(listings);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching PG listings:", err);
        setError("Failed to load PG listings. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [db, isAuthReady]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        navigate('/'); // Navigate to login page after logout
      } catch (error) {
        console.error("Error logging out:", error);
        setError("Failed to log out. Please try again.");
      }
    }
  };

  const handleResetPassword = async () => {
    if (auth && adminEmail) {
      try {
        setLoading(true);
        await sendPasswordResetEmail(auth, adminEmail);
        alert(`Password reset email sent to ${adminEmail}. Please check your inbox.`);
        setError(''); // Clear any previous errors
      } catch (error) {
        console.error("Error sending password reset email:", error);
        let errorMessage = "Failed to send password reset email.";
        if (error.code === 'auth/user-not-found') {
          errorMessage = "No user found with this email.";
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = "Invalid email format.";
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Admin email not available for password reset.");
    }
  };

  const handleViewDetails = (pg) => {
    setSelectedPg(pg);
  };

  const handleCloseDetails = () => {
    setSelectedPg(null);
  };

  const updatePgStatus = async (pgId, newStatus, pgName, pgOwnerEmail) => {
    if (!db) {
      setError("Database not initialized.");
      return;
    }
    setLoading(true);
    try {
      // Adjusted path to align with pg_listings being a root collection
      const pgRef = doc(db, 'pg_listings', pgId); 
      await updateDoc(pgRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      console.log(`PG ${pgName} (${pgId}) status updated to ${newStatus}.`);

      // Simulate sending email notification
      const emailSubject = `Your PG Listing "${pgName}" Has Been ${newStatus === 'accepted' ? 'Accepted' : 'Rejected'}`;
      const emailBody = `Dear PG Owner,\n\nYour PG listing "${pgName}" has been ${newStatus}.\n\n${newStatus === 'rejected' ? 'Reason (if any): [Admin notes here]' : ''}\n\nThank you,\nHomiFi Admin Team`;
      
      alert(`Notification sent to PG owner at ${pgOwnerEmail}:\n\nSubject: ${emailSubject}\nBody: ${emailBody}`);

    } catch (e) {
      console.error(`Error updating PG status for ${pgId}: `, e);
      setError(`Failed to update status for ${pgName}.`);
    } finally {
      setLoading(false);
    }
  };

  const filteredPgListings = pgListings.filter(pg =>
    pg.pgName?.toLowerCase().includes(searchTerm.toLowerCase()) || // Added optional chaining
    pg.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pg.pgOwnerEmail && pg.pgOwnerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
    pg.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthReady) {
    return (
      <div className="admin-dashboard-container">
        <p className="loading-message">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`admin-dashboard-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Hamburger Icon */}
      <div className={`hamburger-icon ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="profile-icon">&#128100;</div> {/* Generic profile icon */}
          <p className="admin-email">{adminEmail || 'Admin User'}</p>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button onClick={() => navigate('/admin-dashboard')} className="sidebar-button">Dashboard</button>
            </li>
            <li>
              <button onClick={handleResetPassword} className="sidebar-button reset-password-button" disabled={loading}>
                {loading ? 'Sending...' : 'Reset Password'}
              </button>
            </li>
            <li>
              <button onClick={handleLogout} className="sidebar-button logout-button" disabled={loading}>Logout</button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="admin-dashboard-header-main"> {/* Renamed for clarity vs sidebar header */}
          <h1>Admin Dashboard</h1>
        </div>

        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search by PG Name, Address, Email, or Status..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        {error && <p className="error-message">{error}</p>}
        {loading && <p className="loading-message">Fetching PG listings...</p>}

        <div className="pg-listings-section">
          <h2>PG Listings for Verification</h2>
          {filteredPgListings.length === 0 && !loading && <p className="no-listings">No PG listings found.</p>}
          <div className="pg-listings-grid"> {/* Added a grid for better layout */}
            {filteredPgListings.map(pg => (
              <div key={pg.id} className={`pg-listing-item ${pg.status}`}>
                <div className="pg-info">
                  <span className="pg-name">{pg.pgName}</span>
                  <span className="pg-owner-email">{pg.pgOwnerEmail}</span> {/* Display owner email in card */}
                  <span className="pg-status">Status: {pg.status?.toUpperCase()}</span> {/* Added optional chaining */}
                </div>
                <div className="pg-actions">
                  <button onClick={() => handleViewDetails(pg)} className="view-button">View Details</button>
                  {pg.status === 'pending' && (
                    <>
                      <button onClick={() => updatePgStatus(pg.id, 'accepted', pg.pgName, pg.pgOwnerEmail)} className="accept-button" disabled={loading}>Accept</button>
                      <button onClick={() => updatePgStatus(pg.id, 'rejected', pg.pgName, pg.pgOwnerEmail)} className="reject-button" disabled={loading}>Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPg && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button onClick={handleCloseDetails} className="modal-close-button">&times;</button>
              <h3>PG Details: {selectedPg.pgName}</h3>
              <p><strong>Owner Name:</strong> {selectedPg.pgOwnerName}</p>
              <p><strong>Owner Email:</strong> {selectedPg.pgOwnerEmail}</p>
              <p><strong>Owner Phone:</strong> {selectedPg.pgOwnerPhoneNumber}</p>
              <p><strong>Address:</strong> {selectedPg.address}, {selectedPg.state}, {selectedPg.country} - {selectedPg.pincode}</p>
              {selectedPg.locationLink && <p><strong>Location Link:</strong> <a href={selectedPg.locationLink} target="_blank" rel="noopener noreferrer">{selectedPg.locationLink}</a></p>}
              <p><strong>Status:</strong> {selectedPg.status?.toUpperCase()}</p>
              <p><strong>Sharing Options:</strong></p>
              <ul>
                {selectedPg.sharingOptions && selectedPg.sharingOptions.map((option, index) => ( // Added null check
                  <li key={index}>{option.type}: {option.status} - ₹{option.price}</li>
                ))}
              </ul>
              <p><strong>Facilities:</strong> {selectedPg.facilities && selectedPg.facilities.join(', ')}</p> {/* Added null check */}
              <div className="modal-photos-grid">
                {selectedPg.photos && selectedPg.photos.map((photo, index) => ( // Added null check
                  <div key={index} className="modal-photo-item">
                    <img src={photo.url} alt={photo.caption || `PG Photo ${index + 1}`} className="modal-photo-image" />
                    {photo.caption && <p className="modal-photo-caption">{photo.caption}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
