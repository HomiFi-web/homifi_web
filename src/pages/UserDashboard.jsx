import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import './UserDashboard.css'; // Import UserDashboard specific CSS

// Declare global variables for ESLint and provide fallback values
// These are typically injected by the Canvas environment, but hardcoding for local dev
const __initial_auth_token = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : '';
const __app_id = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [acceptedPgListings, setAcceptedPgListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        } else {
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

  // Fetch accepted PG listings when Firebase is ready
  useEffect(() => {
    if (db && isAuthReady) {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      // Query for listings where status is 'accepted'
      const q = query(
        collection(db, `artifacts/${appId}/public/data/pg_listings`),
        where('status', '==', 'accepted')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAcceptedPgListings(listings);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching accepted PG listings:", err);
        setError("Failed to load PG listings. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [db, isAuthReady]);

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

  if (!isAuthReady) {
    return (
      <div className="user-dashboard-container">
        <p className="loading-message">Loading User Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      <div className="user-dashboard-header">
        <h1>Welcome, User!</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {loading && <p className="loading-message">Fetching available PGs...</p>}

      <div className="pg-listings-section">
        <h2>Available PG Listings</h2>
        {acceptedPgListings.length === 0 && !loading && <p className="no-listings">No accepted PG listings available yet.</p>}
        <div className="pg-cards-grid">
          {acceptedPgListings.map(pg => (
            <div key={pg.id} className="pg-card">
              {pg.photos && pg.photos.length > 0 && (
                <img src={pg.photos[0].url} alt={pg.photos[0].caption || pg.pgName} className="pg-card-image" />
              )}
              <div className="pg-card-content">
                <h3 className="pg-card-name">{pg.pgName}</h3>
                <p className="pg-card-address">{pg.address}, {pg.state}</p>
                <div className="pg-card-details">
                  <p><strong>Owner:</strong> {pg.pgOwnerName}</p>
                  <p><strong>Email:</strong> {pg.pgOwnerEmail}</p> {/* Display email */}
                  <p><strong>Phone:</strong> {pg.pgOwnerPhoneNumber}</p>
                  <p><strong>Sharing Options:</strong></p>
                  <ul>
                    {pg.sharingOptions.map((option, index) => (
                      <li key={index}>{option.type}: ₹{option.price} ({option.status})</li>
                    ))}
                  </ul>
                  <p><strong>Facilities:</strong> {pg.facilities.join(', ')}</p>
                </div>
                {pg.locationLink && <a href={pg.locationLink} target="_blank" rel="noopener noreferrer" className="pg-card-link">View on Map</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
