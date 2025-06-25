import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

// This path assumes UserDashboard.css is in the same directory (src/pages)
import './UserDashboard.css'; 

// Import images from assets folder relative to src/pages
import heroImage from '../assets/hero-background.jpg'; 
import homifiLogo from '../assets/logo.png'; // Importing the HomiFi logo


// Declare global variables for ESLint and provide fallback values
// These are typically injected by the Canvas environment, but hardcoding for local dev
const __initial_auth_token = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : '';
const __app_id = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';


const UserDashboard = () => {
  const navigate = useNavigate();
  const [allPgListings, setAllPgListings] = useState([]); // State for all accepted PG listings
  const [wishlistedPgMeta, setWishlistedPgMeta] = useState(new Map()); // Map to store pgId -> wishlistDocId for efficient removal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // No more isSidebarOpen, as it's a top nav
  const [activeTab, setActiveTab] = useState('dashboard'); // 'profile', 'dashboard', 'wishlist'

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  

  // Firebase Initialization and Auth
  useEffect(() => {
    try {
      // Hardcode Firebase config for local development - USING USER-PROVIDED CONFIG
      const firebaseConfig = {
        apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A",
        authDomain: "homifi-bac92.firebaseapp.com",
        projectId: "homifi-bac92",
        storageBucket: "homifi-bac92.appspot.com",
        messagingSenderId: "876737044340",
        appId: "1:876737044340:web:07d098db6f17f9c80bd621",
      };
      
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp(); // Initialize only if not already initialized
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          // Use __initial_auth_token if available from the Canvas environment, otherwise sign in anonymously
          const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : '';
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
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

  // Fetch all accepted PG listings
  useEffect(() => {
    if (db && isAuthReady) {
      setLoading(true);
      setError('');
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const q = query(
        collection(db, `artifacts/${appId}/public/data/pg_listings`),
        where('status', '==', 'accepted')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllPgListings(listings);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching all PG listings:", err);
        setError("Failed to load PG listings. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [db, isAuthReady]);

  // Fetch user's wishlist IDs and their corresponding document IDs
  useEffect(() => {
    if (db && isAuthReady && userId) {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const wishlistCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/wishlist`);

      const unsubscribe = onSnapshot(wishlistCollectionRef, (snapshot) => {
        const newWishlistMeta = new Map();
        snapshot.docs.forEach(doc => {
            newWishlistMeta.set(doc.data().pgId, doc.id); // Map pgId to Firestore doc ID
        });
        setWishlistedPgMeta(newWishlistMeta);
      }, (err) => {
        console.error("Error fetching wishlist IDs:", err);
        // This error won't stop the main content from loading, but informs about wishlist issue
        setError("Failed to load your wishlist status. Please try again."); 
      });

      return () => unsubscribe();
    } else if (isAuthReady && !userId) {
      // If auth is ready but no user, clear wishlist (e.g., anonymous user)
      setWishlistedPgMeta(new Map());
    }
  }, [db, isAuthReady, userId]);


  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        navigate('/login'); // Navigate to login page after logout
      } catch (error) {
        console.error("Error logging out:", error);
        setError("Failed to log out. Please try again.");
      }
    }
  };

  const handleToggleWishlist = async (pgId) => {
    if (!userId) {
        navigate('/login'); // Redirect to login if not authenticated
        return;
    }
    if (!db) {
        setError("Database not initialized. Please try again.");
        return;
    }

    try {
        setLoading(true);
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const wishlistRef = collection(db, `artifacts/${appId}/users/${userId}/wishlist`);
        
        // Check if already in wishlist using the map
        const wishlistDocId = wishlistedPgMeta.get(pgId);

        if (wishlistDocId) {
            // Already wishlisted, remove it
            await deleteDoc(doc(wishlistRef, wishlistDocId));
            console.log(`PG ${pgId} removed from wishlist.`);
        } else {
            // Not wishlisted, add it
            await addDoc(wishlistRef, { pgId: pgId, timestamp: serverTimestamp() }); // Use serverTimestamp
            console.log(`PG ${pgId} added to wishlist.`);
        }
    } catch (error) {
        console.error("Error toggling wishlist item:", error);
        setError("Failed to update wishlist. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleShowMoreClick = (pgId) => {
    navigate(`/pg-details/${pgId}`); // Navigate to the details page with the PG ID
  };

  const filteredPgListings = activeTab === 'wishlist'
    ? allPgListings.filter(pg => wishlistedPgMeta.has(pg.id))
    : allPgListings; // For 'dashboard' tab, show all accepted listings


  if (!isAuthReady) {
    return (
      <div className="user-dashboard-container-top-nav"> {/* Changed container class */}
        <p className="loading-message">Loading User Dashboard...</p>
      </div>
    );
  }

  // Display the user ID for debugging/identification in multi-user environments
  const currentUserIdDisplay = userId || 'Not Authenticated';


  return (
    <div className="user-dashboard-container-top-nav"> {/* Main container for the top nav layout */}
      {/* Top Navigation Bar */}
      <nav className="top-nav-bar">
        <div className="top-nav-left">
          <img src={homifiLogo} alt="HomiFi Logo" className="top-nav-logo" /> {/* Used imported homifiLogo */}
          <h2 className="top-nav-title"></h2>
        </div>
        <div className="top-nav-right">
          <ul className="top-nav-menu">
            <li 
              className={`top-nav-menu-item ${activeTab === 'profile' ? 'active' : ''}`} 
              onClick={() => setActiveTab('profile')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profile</span>
            </li>
            <li 
              className={`top-nav-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
              onClick={() => setActiveTab('dashboard')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-home">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Dashboard</span>
            </li>
            <li 
              className={`top-nav-menu-item wishlist-item ${activeTab === 'wishlist' ? 'active' : ''}`} 
              onClick={() => setActiveTab('wishlist')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={activeTab === 'wishlist' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-heart">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>Wishlist</span>
            </li>
            <li className="top-nav-menu-item" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-out">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="main-content-header">
          {/* Header text changes based on active tab */}
          <h1>
            {activeTab === 'profile' && 'User Profile'}
            {activeTab === 'dashboard' && 'Browse Available PGs'}
            {activeTab === 'wishlist' && 'My Wishlisted PGs'}
          </h1>
        </div>

        {error && <p className="error-message">{error}</p>}
        {loading && <p className="loading-message">Fetching {activeTab === 'dashboard' ? 'available PGs' : 'your wishlisted PGs'}...</p>}

        {/* Conditional rendering of content based on activeTab */}
        {activeTab === 'profile' && (
          <div className="user-profile-section">
            <h2>User Profile</h2>
            <p><strong>Email:</strong> {auth?.currentUser?.email || 'N/A'}</p>
            <p><strong>User ID:</strong> {userId || 'N/A'}</p>
            <p>This is where user profile details and settings would be managed.</p>
            {/* Add more profile fields/forms here */}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            {!loading && filteredPgListings.length === 0 && (
              <p className="no-listings">No accepted PG listings available yet.</p>
            )}
            <div className="pg-cards-grid">
              {filteredPgListings.map(pg => (
                <div key={pg.id} className="pg-card">
                  {pg.photos && pg.photos.length > 0 && pg.photos[0].url ? (
                    <img src={pg.photos[0].url} alt={pg.photos[0].caption || pg.pgName} className="pg-card-image" />
                  ) : (
                    <img src="https://placehold.co/300x200/E0E0E0/333333?text=No+Image" alt="No Image Available" className="pg-card-image" />
                  )}
                  <div className="pg-details-section">
                    <h3 className="pg-name-in-card">{pg.pgName}</h3>
                    <p className="pg-address-in-card">{pg.address}, {pg.state}</p>
                  </div>

                  <div className="pg-sharing-options-summary">
                    {pg.sharingOptions &&
                        pg.sharingOptions
                            .filter(option => option.status?.toLowerCase() === 'available')
                            .slice(0, 3)
                            .map((option, idx) => (
                                <div key={idx} className="pg-sharing-option-inline">
                                    <span className="sharing-type">{option.type}</span>
                                    <span className="sharing-price">₹{option.price || 'N/A'}</span>
                                </div>
                            ))}
                  </div>

                  <div className="pg-card-actions">
                      <button
                          onClick={() => handleToggleWishlist(pg.id)}
                          className={`wishlist-icon-button ${wishlistedPgMeta.has(pg.id) ? 'active' : ''}`}
                          title={wishlistedPgMeta.has(pg.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={wishlistedPgMeta.has(pg.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-heart">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                      </button>

                      {pg.sharingOptions && pg.sharingOptions.length > 0 && (
                          <button onClick={() => handleShowMoreClick(pg.id)} className="show-more-button">
                              Show More
                          </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'wishlist' && (
          <>
            {!loading && filteredPgListings.length === 0 && (
              <p className="no-listings">Your wishlist is currently empty. Go to "Browse PGs" to add some!</p>
            )}
            <div className="pg-cards-grid">
              {filteredPgListings.map(pg => (
                <div key={pg.id} className="pg-card">
                  {pg.photos && pg.photos.length > 0 && pg.photos[0].url ? (
                    <img src={pg.photos[0].url} alt={pg.photos[0].caption || pg.pgName} className="pg-card-image" />
                  ) : (
                    <img src="https://placehold.co/300x200/E0E0E0/333333?text=No+Image" alt="No Image Available" className="pg-card-image" />
                  )}
                  <div className="pg-details-section">
                    <h3 className="pg-name-in-card">{pg.pgName}</h3>
                    <p className="pg-address-in-card">{pg.address}, {pg.state}</p>
                  </div>

                  <div className="pg-card-details"> {/* This section is for detailed display of wishlisted items */}
                    <p><strong>Owner:</strong> {pg.pgOwnerName}</p>
                    <p><strong>Email:</strong> {pg.pgOwnerEmail}</p>
                    <p><strong>Phone:</strong> {pg.pgOwnerPhoneNumber}</p>
                    <p><strong>Sharing Options:</strong></p>
                    <ul>
                      {pg.sharingOptions && pg.sharingOptions.map((option, index) => (
                        <li key={index}>{option.type}: ₹{option.price} ({option.status})</li>
                      ))}
                    </ul>
                    <p><strong>Facilities:</strong> {pg.facilities && pg.facilities.join(', ')}</p>
                  </div>
                  {pg.locationLink && <a href={pg.locationLink} target="_blank" rel="noopener noreferrer" className="pg-card-link">View on Map</a>}
                  <button
                    onClick={() => handleToggleWishlist(pg.id)} // This will now remove the item from wishlist
                    className="remove-from-wishlist-button"
                    title="Remove from Wishlist"
                  >
                    Remove from Wishlist
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x-circle">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
