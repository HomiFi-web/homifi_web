import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, deleteDoc, addDoc, serverTimestamp, updateDoc, getDocs, writeBatch, orderBy } from 'firebase/firestore';
import { User, LayoutDashboard, Heart, LogOut, Menu, Key } from 'lucide-react';

// Declare global variables for ESLint and provide fallback values
const __initial_auth_token = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : '';
const __app_id = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'homifi-4d283'; // UPDATED: Set fallback to your project ID
const firebaseConfig = typeof window !== 'undefined' && typeof window.__firebase_config !== 'undefined' ? JSON.parse(window.__firebase_config) : {
  apiKey: "AIzaSyCENbG6LtD_dVaNoqyoJuLmxiyTQNi6e0E", // UPDATED: Your Web API Key
  authDomain: "homifi-4d283.firebaseapp.com", // UPDATED: Derived from your Project ID
  projectId: "homifi-4d283", // UPDATED: Your Project ID
  storageBucket: "homifi-4d283.appspot.com", // UPDATED: Derived from your Project ID
  messagingSenderId: "434013049134", // UPDATED: Your Project Number
  appId: "1:434013049134:web:a_unique_hash_from_firebase" // UPDATED: Use your project number; replace 'a_unique_hash_from_firebase' with the actual hash from your Firebase console if known
};


const UserDashboard = () => {
  const navigate = useNavigate();
  const [allPgListings, setAllPgListings] = useState([]); // State for all accepted PG listings
  const [myPgListings, setMyPgListings] = useState([]); // State for current user's own PG listings
  const [wishlistedPgMeta, setWishlistedPgMeta] = useState(new Map()); // Map to store pgId -> wishlistDocId for efficient removal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sidebar and active section states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard', 'wishlist', 'myListings'
  const [hoveredButton, setHoveredButton] = useState(null); // For sidebar button hover effects

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(''); // To display user's email in profile
  const [isAuthReady, setIsAuthReady] = useState(false);


  // Message states for displaying feedback to the user
  const [message, setMessage] = useState('');
  const [messageType, setMessageType ] = useState(''); // 'success', 'error', 'info'

  // Refs for closing popups/sidebar on outside click
  const sidebarRef = useRef(null);
  const messageBoxRef = useRef(null);


  // Firebase Initialization and Auth
  useEffect(() => {
    try {
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp(); // Initialize only if not already initialized
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          // Set user email for display, defaulting to 'Guest' if not available (e.g., anonymous login)
          setUserEmail(user.email || 'Guest');
        } else {
          // Use __initial_auth_token if available from the Canvas environment, otherwise sign in anonymously
          const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : '';
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            await signInAnonymously(authInstance);
          }
          setUserEmail('Guest'); // Default for anonymous or not logged in
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      setError(`Failed to initialize the application: ${error.message}. Please try again.`);
    }
  }, []);

  // Fetch all accepted PG listings (for 'Browse Available PGs' section)
  useEffect(() => {
    if (db && isAuthReady) {
      setLoading(true);
      setError('');
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-4d283';
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

  // Fetch current user's own PG listings (for 'My Listings' section)
  useEffect(() => {
    if (db && isAuthReady && userId) {
      setLoading(true);
      setError('');
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-4d283';
      const q = query(
        collection(db, `artifacts/${appId}/users/${userId}/pg_listings`)
        // No 'where' clause here to fetch all of *this user's* PGs, regardless of status
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMyPgListings(listings);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching user's own PG listings:", err);
        setError("Failed to load your own PG listings. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe();
    } else if (isAuthReady && !userId) {
      // If auth is ready but no user, clear myPgListings
      setMyPgListings([]);
    }
  }, [db, isAuthReady, userId]);


  // Fetch user's wishlist IDs and their corresponding document IDs
  useEffect(() => {
    if (db && isAuthReady && userId) {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-4d283';
      const wishlistCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/wishlist`);

      const unsubscribe = onSnapshot(wishlistCollectionRef, (snapshot) => {
        const newWishlistMeta = new Map();
        snapshot.docs.forEach(doc => {
            newWishlistMeta.set(doc.data().pgId, doc.id); // Map pgId to Firestore doc ID
        });
        setWishlistedPgMeta(newWishlistMeta);
      }, (err) => {
        console.error("Error fetching wishlist IDs:", err);
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
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-4d283';
        const wishlistRef = collection(db, `artifacts/${appId}/users/${userId}/wishlist`);

        // Check if already in wishlist using the map
        const wishlistDocId = wishlistedPgMeta.get(pgId);

        if (wishlistDocId) {
            // Already wishlisted, remove it
            await deleteDoc(doc(wishlistRef, wishlistDocId));
            displayMessage(`PG removed from wishlist.`, 'info');
            console.log(`PG ${pgId} removed from wishlist.`);
        } else {
            // Not wishlisted, add it
            await addDoc(wishlistRef, { pgId: pgId, timestamp: serverTimestamp() }); // Use serverTimestamp
            displayMessage(`PG added to wishlist!`, 'success');
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

  // Determine which list of PGs to display based on activeSection
  const displayedPgListings = activeSection === 'wishlist'
    ? allPgListings.filter(pg => wishlistedPgMeta.has(pg.id))
    : activeSection === 'myListings'
      ? myPgListings
      : allPgListings; // Default to all accepted listings for 'dashboard'


  // Function to display messages to the user (similar to PgOwnerDashboard)
  const displayMessage = (text, type, duration = 5000) => {
    setMessage(text);
    setMessageType(type);
    if (type !== 'error') {
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, duration);
    }
  };

  // Profile button in top nav will open sidebar and set active section to dashboard
  const handleProfileClick = () => {
    // No change to active section on profile click, just open sidebar
    setIsSidebarOpen(true); // Open sidebar
  };

  const handleDashboardClick = () => {
    setActiveSection('dashboard');
    // Do NOT close sidebar here, as this function might be called from top nav
    displayMessage('Browsing available PG listings.', 'info', 2000);
  };

  const handleWishlistClick = () => {
    setActiveSection('wishlist');
    // Do NOT close sidebar here, as this function might be called from top nav
    displayMessage('Viewing your wishlisted PGs.', 'info', 2000);
  };

  // Handler for 'My Listings' sidebar button
  const handleMyListingsClick = () => {
    setActiveSection('myListings');
    setIsSidebarOpen(false); // Close sidebar after selection, as it's a sidebar-specific action
    displayMessage('Viewing your submitted PG listings.', 'info', 2000);
  };


  const handleResetPassword = async () => {
    if (!auth || !auth.currentUser || !auth.currentUser.email) {
      displayMessage("Please log in with an email to reset your password.", "error");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      displayMessage("Password reset link sent to your email!", "success");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      displayMessage(`Failed to send password reset email: ${error.message}`, "error");
    } finally {
      setLoading(false);
      setIsSidebarOpen(false); // Close sidebar after action
    }
  };


  // Close notification popup/sidebar/message box if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      if (messageBoxRef.current && !messageBoxRef.current.contains(event.target) && message) {
        setMessage('');
        setMessageType('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, message]);


  if (!isAuthReady) {
    return (
      <div className="pg-owner-dashboard-wrapper">
        <p className="loading-message">Loading User Dashboard...</p>
      </div>
    );
  }


  return (
    <div className="pg-owner-dashboard-wrapper">
      <style>{`
        /* Define HomiFi Color Palette as CSS Variables - Enhanced for Professional Look */
        :root {
            --homifi-dark-blue: #1A123F; /* Deeper, richer dark blue */
            --homifi-teal: #2DCAB5; /* Slightly softer, sophisticated teal */
            --homifi-cyan: #00B1C4; /* A refined cyan */
            --homifi-darker-blue: #140D2F; /* Even darker for strong contrasts */
            --homifi-deepest-blue: #0E0824; /* Background deep blue */

            --success-green: #2ecc71; /* Modern success green */
            --error-red: #e74c3c; /* Modern error red */
            --warning-orange: #f39c12; /* Modern warning orange */

            --bg-light-grey: #f0f2f5; /* Softer light grey background */
            --bg-white: #ffffff; /* Clean white background */
            --bg-soft-blue: #e8f5e9; /* Very light background for subtle sections, changed from blue to green tint for success/info feeling */
            --bg-card: #ffffff; /* Explicit card background */
            --bg-gradient-start: #20143b; /* Maintain original gradient feel */
            --bg-gradient-end: #000040; /* Maintain original gradient feel */

            /* Typography */
            --font-family-sans-serif: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            --font-size-base: 1rem;
            --line-height-base: 1.6; /* Slightly increased for readability */

            /* Spacing */
            --spacing-xs: 0.25rem;
            --spacing-sm: 0.5rem;
            --spacing-md: 1rem;
            --spacing-lg: 1.5rem;
            --spacing-xl: 2rem;

            /* Border Radius */
            --border-radius-small: 0.3rem;
            --border-radius-medium: 0.5rem;
            --border-radius-large: 0.8rem; /* Slightly larger for a softer look */

            /* Shadows - Enhanced for depth and softness */
            --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08);
            --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12);
            --shadow-lg: 0 8px 25px rgba(0, 0, 0, 0.15); /* New, for more prominent elements */
        }

        /* Base Styles */
        body {
            font-family: var(--font-family-sans-serif);
            line-height: var(--line-height-base);
            color: var(--text-dark);
            background-color: var(--bg-light-grey);
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        /* Main Dashboard Container - The outermost div */
        .pg-owner-dashboard-wrapper {
            display: flex;
            min-height: 100vh;
            background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
            color: var(--bg-white);
            position: relative; /* Needed for sidebar positioning */
        }

        /* Top Navigation Bar */
        .top-nav-bar {
            background-color: var(--homifi-darker-blue);
            padding: 0.8rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: var(--shadow-md);
            z-index: 1000;
            width: 100%;
            position: fixed;
            top: 0;
            left: 0;
        }

        .top-nav-left {
            display: flex;
            align-items: center;
            gap: 1.5rem; /* Space between logo and nav links */
        }

        .homifi-logo-text {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--homifi-teal);
            margin-right: 0; /* Removed margin-right as gap handles spacing */
        }

        .top-nav-links {
            display: flex;
            gap: 1.2rem; /* Space between nav links */
        }

        .top-nav-link-button {
            background-color: transparent;
            border: none;
            color: var(--bg-white);
            font-size: 1.1rem;
            font-weight: 600;
            padding: 8px 15px;
            border-radius: var(--border-radius-medium);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .top-nav-link-button:hover,
        .top-nav-link-button.active {
            color: var(--homifi-teal);
            background-color: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .top-nav-link-button.active {
            box-shadow: 0 0 0 2px var(--homifi-teal); /* Highlight active link */
        }


        /* Profile Button in Top Nav */
        .profile-button-top-nav {
            cursor: pointer;
            color: var(--bg-white);
            font-size: 1.1rem;
            background-color: transparent;
            border: none;
            padding: 8px 15px;
            border-radius: var(--border-radius-medium);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            box-shadow: none;
            font-weight: 600;
            gap: 8px;
        }

        .profile-button-top-nav:hover {
            color: var(--homifi-teal);
            background-color: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
            box-shadow: none;
        }

        /* Right Sidebar */
        .profile-sidebar {
            position: fixed;
            top: 0;
            right: -280px;
            width: 260px;
            height: 100%;
            background-color: var(--homifi-darker-blue);
            color: var(--bg-white);
            box-shadow: -6px 0 15px rgba(0, 0, 0, 0.25);
            transition: right 0.3s ease-in-out;
            z-index: 1100;
            display: flex;
            flex-direction: column;
            padding: 1.5rem 1rem;
        }

        .profile-sidebar.open {
            right: 0;
        }

        .sidebar-close-button {
            background: none;
            border: none;
            color: var(--bg-white);
            font-size: 2rem;
            align-self: flex-end;
            cursor: pointer;
            margin-bottom: 1rem;
            transition: color 0.2s ease, transform 0.2s ease;
        }

        .sidebar-close-button:hover {
            color: var(--error-red);
            transform: rotate(90deg);
        }

        .sidebar-content {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            flex-grow: 1;
        }

        .sidebar-user-email {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: var(--homifi-teal);
            text-align: center;
            word-wrap: break-word;
        }

        .sidebar-button {
            background-color: var(--homifi-dark-blue);
            color: var(--bg-white);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 0.7rem 1rem;
            border-radius: var(--border-radius-medium);
            display: flex;
            align-items: center;
            gap: 0.8rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
        }

        .sidebar-button:hover {
            background-color: var(--homifi-cyan);
            color: var(--homifi-dark-blue);
            transform: translateX(6px);
            box-shadow: var(--shadow-md);
        }

        .sidebar-button svg {
            color: var(--homifi-teal);
            font-size: 1.15rem;
            transition: color 0.3s ease;
        }

        .sidebar-button:hover svg {
            color: var(--homifi-dark-blue);
        }

        /* Main Content Area */
        .dashboard-content-area {
            flex-grow: 1;
            padding: 2.5rem;
            max-width: 1200px;
            margin: 60px auto 2.5rem auto;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
            align-items: center;
            justify-content: center;
        }

        .dashboard-content-area.shifted {
            margin-right: 260px;
        }

        .main-content-header {
            font-size: 2rem;
            color: var(--homifi-teal);
            margin-bottom: 2rem;
            text-align: center;
            font-weight: 700;
            width: 100%;
        }

        /* Error and Loading Messages */
        .error-message, .loading-message, .no-listings {
            text-align: center;
            color: var(--error-red);
            background-color: #f2dede;
            padding: 1rem;
            border-radius: var(--border-radius-medium);
            margin-bottom: 1.5rem;
            width: 100%;
            max-width: 800px;
            box-sizing: border-box;
        }
        .loading-message {
            color: var(--homifi-dark-blue);
            background-color: var(--bg-soft-blue);
        }
        .no-listings {
            color: var(--text-medium);
            background-color: var(--bg-light-grey);
        }

        /* PG Listing Grid */
        .pg-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.8rem;
            margin-top: 1.8rem;
            width: 100%;
            max-width: 1200px;
        }

        .pg-card {
            background-color: var(--bg-card);
            padding: 1.8rem;
            border-radius: var(--border-radius-large);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border-light);
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .pg-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-lg);
        }

        .pg-card-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: var(--border-radius-medium);
            margin-bottom: 0.8rem;
        }

        .pg-details-section {
            padding: 0;
        }

        .pg-name-in-card {
            font-size: 1.4rem;
            color: var(--homifi-dark-blue);
            margin-bottom: 0.5rem;
            font-weight: 600;
        }

        .pg-address-in-card {
            font-size: 0.95rem;
            color: var(--text-medium);
            margin-bottom: 1rem;
        }

        .pg-card-details p {
            margin-bottom: 0.6rem;
            font-size: 0.9rem;
            color: var(--text-dark);
        }

        .pg-card-details strong {
            color: var(--homifi-dark-blue);
        }

        .pg-card-details ul {
            list-style: none;
            padding: 0;
            margin-top: 0.5rem;
            margin-bottom: 1rem;
        }

        .pg-card-details ul li {
            font-size: 0.85rem;
            color: var(--text-medium);
            margin-bottom: 0.3rem;
            background-color: var(--bg-light-grey);
            padding: 0.4rem 0.8rem;
            border-radius: var(--border-radius-small);
            border: 1px solid var(--border-subtle);
        }

        .pg-card-link {
            display: inline-block;
            margin-top: 1rem;
            padding: 0.6rem 1.2rem;
            background-color: var(--homifi-cyan);
            color: var(--bg-white);
            text-decoration: none;
            border-radius: var(--border-radius-medium);
            font-size: 0.9rem;
            text-align: center;
            transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 2px 5px rgba(0, 177, 196, 0.2);
        }

        .pg-card-link:hover {
            background-color: #00afc5;
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0, 177, 196, 0.3);
        }

        /* Wishlist specific button for cards */
        .wishlist-icon-button, .remove-from-wishlist-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            transition: background-color 0.3s ease, transform 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 0.8rem;
            color: var(--error-red);
        }

        .wishlist-icon-button svg, .remove-from-wishlist-button svg {
            fill: none;
            transition: fill 0.3s ease;
            width: 24px;
            height: 24px;
        }

        .wishlist-icon-button.active svg {
            fill: var(--error-red);
        }

        .remove-from-wishlist-button {
            background-color: var(--error-red);
            color: white;
            padding: 0.6rem 1.2rem;
            border-radius: var(--border-radius-medium);
            width: auto;
            align-self: flex-start;
            font-weight: 600;
            gap: 0.5rem;
            box-shadow: 0 2px 5px rgba(231, 76, 60, 0.2);
        }

        .remove-from-wishlist-button:hover {
            background-color: #c0392b;
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3);
        }

        .remove-from-wishlist-button svg {
            color: white;
        }


        /* Styling for inline sharing options */
        .pg-sharing-options-summary {
            padding: 0 0 1rem 0;
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
            justify-content: flex-start;
            border-bottom: 1px solid var(--border-subtle);
            margin-bottom: 1rem;
        }

        .pg-sharing-option-inline {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background-color: var(--bg-soft-blue);
            padding: 0.5rem 0.8rem;
            border-radius: var(--border-radius-medium);
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--homifi-dark-blue);
            white-space: nowrap;
            border: 1px solid var(--border-light);
        }

        .sharing-type {
            text-transform: capitalize;
        }

        .sharing-price {
            color: var(--success-green);
            font-weight: 700;
        }

        .pg-card-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0;
            margin-top: auto;
            border-top: 1px solid var(--border-subtle);
            padding-top: 1rem;
        }

        .show-more-button {
            background-color: var(--homifi-cyan);
            color: var(--bg-white);
            border: none;
            border-radius: var(--border-radius-medium);
            padding: 0.6rem 1.2rem;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
            width: fit-content;
            align-self: center;
            box-shadow: 0 2px 5px rgba(0, 177, 196, 0.2);
        }

        .show-more-button:hover {
            background-color: #00afc5;
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0, 177, 196, 0.3);
        }

        /* Message Box Popup Styles */
        .message-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1500;
            animation: fadeIn 0.3s ease-out;
        }

        .app-message-box {
            background-color: var(--bg-white);
            color: var(--text-dark);
            padding: 1.5rem 2rem;
            border-radius: var(--border-radius-large);
            box-shadow: var(--shadow-lg);
            width: 90%;
            max-width: 450px;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            border: 1px solid transparent;
            animation: slideInFromTop 0.3s ease-out;
        }

        .app-message-box p {
            margin: 0 0 1rem 0;
            font-size: 1.1rem;
            flex-grow: 1;
        }

        .app-message-box.success {
            border-color: var(--success-green);
            background-color: #dff0d8;
            color: #3c763d;
        }

        .app-message-box.error {
            border-color: var(--error-red);
            background-color: #f2dede;
            color: #a94442;
        }

        .app-message-box.info {
            border-color: var(--homifi-cyan);
            background-color: #d9edf7;
            color: #31708f;
        }

        .app-message-box-close-button {
            background: var(--homifi-teal);
            color: var(--homifi-dark-blue);
            border: none;
            padding: 0.6rem 1.5rem;
            border-radius: var(--border-radius-medium);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease, transform 0.2s ease;
            margin-top: 0.5rem;
        }

        .app-message-box-close-button:hover {
            background-color: #27c2b6;
            transform: translateY(-2px);
        }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideInFromTop {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }


        /* Responsive adjustments */
        @media (max-width: 992px) {
            .top-nav-bar {
                padding: 0.8rem 1rem; /* Slightly less padding */
            }
            .homifi-logo-text {
                font-size: 1.5rem; /* Smaller logo */
            }
            .top-nav-links {
                gap: 0.8rem; /* Closer links */
            }
            .top-nav-link-button {
                font-size: 1rem;
                padding: 6px 10px;
            }
            .top-nav-link-button svg {
                display: none; /* Hide icons on smaller screens for brevity */
            }
            .profile-button-top-nav {
                font-size: 1rem;
                padding: 6px 10px;
            }
            .profile-button-top-nav svg {
                margin-right: 0;
            }

            .dashboard-content-area {
                padding: 1.5rem;
                margin: 1.5rem auto;
                gap: 1.5rem;
            }

            .form-group-inline-wrapper {
                flex-direction: column;
                gap: 1rem;
            }

            .form-group-half-wrapper {
                min-width: unset;
                width: 100%;
            }

            .sharing-options-grid,
            .amenities-checkbox-grid,
            .listings-grid {
                grid-template-columns: 1fr;
            }

            .form-actions {
                flex-direction: column;
                gap: 0.8rem;
            }

            .button {
                width: 100%;
                padding: 0.8rem 1.5rem;
                font-size: 1rem;
            }

            .gender-preference-radio-group {
                flex-direction: column;
                gap: 12px;
            }
            .pg-details-form-card,
            .owner-listings-section {
                padding: 2rem;
            }
        }

        @media (max-width: 768px) {
            .pg-details-form-card,
            .owner-listings-section {
                padding: 1.5rem;
            }

            .form-title,
            .section-title {
                font-size: 1.6rem;
                margin-bottom: 1.2rem;
            }
            .photo-preview-grid {
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 0.6rem;
                padding: 0.6rem;
            }
            .photo-preview-image {
                height: 70px;
            }
            .photo-caption-input {
                font-size: 0.7rem;
            }
            .remove-photo-button {
                width: 22px;
                height: 22px;
                font-size: 1.1rem;
                top: 6px;
                right: 6px;
            }
            .app-message-box {
                padding: 0.8rem 1.2rem;
                font-size: 0.85rem;
                min-height: 50px;
            }
            .app-message-box-close-button {
                font-size: 1.3rem;
            }
            .sidebar-button {
                padding: 0.7rem 1rem;
                font-size: 0.95rem;
            }
            .sidebar-button svg {
                font-size: 1.1rem;
            }
            .profile-sidebar {
                width: 250px;
            }
        }

        @media (max-width: 480px) {
            .top-nav-bar {
                padding: 0.4rem 0.75rem;
            }
            .homifi-logo-text {
                font-size: 1.25rem;
            }
            .top-nav-links {
                display: none; /* Hide main nav links on very small screens, rely on sidebar */
            }
            .profile-button-top-nav {
                font-size: 0.9rem;
                padding: 4px 8px;
            }
            .profile-button-top-nav svg {
                font-size: 18px;
            }

            .pg-details-form-card,
            .owner-listings-section {
                padding: 1rem;
            }
            .form-title,
            .section-title {
                font-size: 1.25rem;
            }
            .photo-preview-grid {
                grid-template-columns: 1fr;
                gap: 0.8rem;
                padding: 0.5rem;
            }
            .photo-preview-image {
                height: 100px;
            }
            .form-actions .button {
                padding: 0.7rem 1rem;
                font-size: 0.9rem;
            }
            .sidebar-user-email {
                font-size: 0.95rem;
            }
            .sidebar-button {
                font-size: 0.9rem;
                gap: 0.6rem;
            }
            .sidebar-button svg {
                font-size: 1rem;
            }
            .profile-sidebar {
                width: 220px;
                right: -240px;
                padding: 1.5rem 0.8rem;
            }
        }
      `}</style>
      {/* Top Navigation Bar */}
      <nav className="top-nav-bar">
        <div className="top-nav-left">
          <span className="homifi-logo-text">HomiFi</span> {/* Using text logo */}
          <div className="top-nav-links">
            {/* Direct link for Browse PGs (Dashboard) */}
            <button
              onClick={handleDashboardClick}
              className={`top-nav-link-button ${activeSection === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} />
              <span>Browse PGs</span>
            </button>
            {/* Direct link for Wishlist */}
            <button
              onClick={handleWishlistClick}
              className={`top-nav-link-button ${activeSection === 'wishlist' ? 'active' : ''}`}
            >
              <Heart size={20} />
              <span>Wishlist</span>
            </button>
          </div>
        </div>
        <div className="top-nav-right">
          {/* Profile button to toggle sidebar */}
          <button className="profile-button-top-nav" onClick={handleProfileClick}>
            <User size={20} /> {/* User icon for the profile button */}
            Profile
          </button>
        </div>
      </nav>

      {/* Right Sidebar for Profile and Navigation */}
      <div ref={sidebarRef} className={`profile-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close-button" onClick={() => setIsSidebarOpen(false)}>
          &times;
        </button>
        <div className="sidebar-content">
          <p className="sidebar-user-email">Welcome, {userEmail}</p>

          {/* My Listings Button (now only in sidebar) */}
          <button
            onClick={handleMyListingsClick}
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('myListings')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Menu size={20} /> {/* Using Menu icon for 'My Listings' */}
            <span>{hoveredButton === 'myListings' ? 'My Listings' : 'My Listings'}</span>
          </button>

          {/* Reset Password Button in Sidebar */}
          {auth?.currentUser?.email && ( // Only show if user has an email (not anonymous)
            <button
                onClick={handleResetPassword}
                className="sidebar-button"
                onMouseEnter={() => setHoveredButton('resetPassword')}
                onMouseLeave={() => setHoveredButton(null)}
                disabled={loading}
            >
                <Key size={20} />
                <span>{hoveredButton === 'resetPassword' ? 'Change Password' : 'Reset Password'}</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={() => { handleLogout(); setIsSidebarOpen(false); }}
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('logout')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <LogOut size={20} />
            <span>{hoveredButton === 'logout' ? 'Sign Out' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className={`dashboard-content-area ${isSidebarOpen ? 'shifted' : ''}`}>
        {/* Message Box as a Popup */}
        {message && (
          <div className="message-popup-overlay">
            <div ref={messageBoxRef} className={`app-message-box ${messageType}`}>
              <p>{message}</p>
              <button className="app-message-box-close-button" onClick={() => setMessage('')}>OK</button>
            </div>
          </div>
        )}

        <div className="main-content-header">
          <h1>
            {activeSection === 'dashboard' && 'Browse Available PGs'}
            {activeSection === 'wishlist' && 'My Wishlisted PGs'}
            {activeSection === 'myListings' && 'My Submitted PG Listings'}
          </h1>
        </div>

        {error && <p className="error-message">{error}</p>}
        {loading && <p className="loading-message">Fetching {activeSection === 'dashboard' ? 'available PGs' : activeSection === 'wishlist' ? 'your wishlisted PGs' : 'your submitted PGs'}...</p>}

        {/* Conditional rendering of content based on activeSection */}
        {activeSection === 'dashboard' && (
          <>
            {!loading && displayedPgListings.length === 0 && (
              <p className="no-listings">No accepted PG listings available yet.</p>
            )}
            <div className="pg-cards-grid">
              {displayedPgListings.map(pg => (
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

        {activeSection === 'wishlist' && (
          <>
            {!loading && displayedPgListings.length === 0 && (
              <p className="no-listings">Your wishlist is currently empty. Go to "Browse PGs" to add some!</p>
            )}
            <div className="pg-cards-grid">
              {displayedPgListings.map(pg => (
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

        {/* My Listings Section */}
        {activeSection === 'myListings' && (
          <>
            {!loading && displayedPgListings.length === 0 && (
              <p className="no-listings">You have not submitted any PG listings yet.</p>
            )}
            <div className="pg-cards-grid">
              {displayedPgListings.map(pg => (
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

                  <div className="pg-card-details"> {/* Display full details for own listings */}
                    <p><strong>Status:</strong> {pg.status ? pg.status.toUpperCase() : 'N/A'}</p> {/* Show status */}
                    <p><strong>Gender:</strong> {pg.genderPreference}</p>
                    <p><strong>Sharing Options:</strong></p>
                    <ul>
                      {pg.sharingOptions && pg.sharingOptions.map((option, index) => (
                        <li key={index}>{option.type}: ₹{option.price} ({option.status})</li>
                      ))}
                    </ul>
                    <p><strong>Facilities:</strong> {pg.facilities && pg.facilities.join(', ')}</p>
                    <p><strong>Description:</strong> {pg.description || 'N/A'}</p>
                  </div>
                  {pg.locationLink && <a href={pg.locationLink} target="_blank" rel="noopener noreferrer" className="pg-card-link">View on Map</a>}
                  {/* You might want to add edit/delete buttons here for owner's listings */}
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
