import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth';
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

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Firebase Initialization and Auth
  useEffect(() => {
    try {
      // Hardcode Firebase config for local development
      const firebaseConfig = {
        apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A", // Your Web API Key
        authDomain: "helphomifi-bac92.firebaseapp.com",
        projectId: "helphomifi-bac92",
        storageBucket: "helphomifi-bac92.appspot.com",
        messagingSenderId: "876737044340", // Your Project number
        appId: "1:876737044340:web:07d098db6f17f9c80bd621", // This is derived from Project Number and Web API Key
        // measurementId: "G-XXXXXXXXXX" // Optional: if you use Google Analytics for Firebase
      };
      
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          // In a real app, you'd check if this user is actually an admin
          // For now, we assume anyone logged in here is an admin.
        } else {
          // Attempt to sign in anonymously if no token, or use token if available
          if (__initial_auth_token) {
            await signInWithCustomToken(authInstance, __initial_auth_token);
          } else {
            await signInAnonymously(authInstance);
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
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const q = query(collection(db, `artifacts/${appId}/public/data/pg_listings`));

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

  const handleViewDetails = (pg) => {
    setSelectedPg(pg);
  };

  const handleCloseDetails = () => {
    setSelectedPg(null);
  };

  const updatePgStatus = async (pgId, newStatus, pgName, pgOwnerEmail) => { // Added pgOwnerEmail
    if (!db) {
      setError("Database not initialized.");
      return;
    }
    setLoading(true);
    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const pgRef = doc(db, `artifacts/${appId}/public/data/pg_listings`, pgId);
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
    pg.pgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pg.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pg.pgOwnerEmail && pg.pgOwnerEmail.toLowerCase().includes(searchTerm.toLowerCase())) || // Search by email
    pg.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthReady) {
    return (
      <div className="admin-dashboard-container">
        <p className="loading-message">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
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
        {filteredPgListings.map(pg => (
          <div key={pg.id} className={`pg-listing-item ${pg.status}`}>
            <div className="pg-info">
              <span className="pg-name">{pg.pgName}</span>
              <span className="pg-status">Status: {pg.status.toUpperCase()}</span>
            </div>
            <div className="pg-actions">
              <button onClick={() => handleViewDetails(pg)} className="view-button">View</button>
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

      {selectedPg && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={handleCloseDetails} className="modal-close-button">&times;</button>
            <h3>PG Details: {selectedPg.pgName}</h3>
            <p><strong>Owner:</strong> {selectedPg.pgOwnerName}</p>
            <p><strong>Email:</strong> {selectedPg.pgOwnerEmail}</p> {/* Display email */}
            <p><strong>Phone:</strong> {selectedPg.pgOwnerPhoneNumber}</p>
            <p><strong>Address:</strong> {selectedPg.address}, {selectedPg.state}, {selectedPg.country} - {selectedPg.pincode}</p>
            {selectedPg.locationLink && <p><strong>Location Link:</strong> <a href={selectedPg.locationLink} target="_blank" rel="noopener noreferrer">{selectedPg.locationLink}</a></p>}
            <p><strong>Status:</strong> {selectedPg.status.toUpperCase()}</p>
            <p><strong>Sharing Options:</strong></p>
            <ul>
              {selectedPg.sharingOptions.map((option, index) => (
                <li key={index}>{option.type}: {option.status} - ₹{option.price}</li>
              ))}
            </ul>
            <p><strong>Facilities:</strong> {selectedPg.facilities.join(', ')}</p>
            <div className="modal-photos-grid">
              {selectedPg.photos.map((photo, index) => (
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
  );
};

export default AdminDashboard;
