import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, doc, updateDoc, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
import { User, LayoutDashboard, Bell, Key, LogOut, XCircle, CheckCircle, List } from 'lucide-react'; // Added List icon

// Declare global variables for ESLint and provide fallback values
const __initial_auth_token = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : '';
const __app_id = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'homifi-4d283';
const firebaseConfig = typeof window !== 'undefined' && typeof window.__firebase_config !== 'undefined' ? JSON.parse(window.__firebase_config) : {
  apiKey: "AIzaSyCENbG6LtD_dVaNoqyoJuLmxiyTQNi6e0E",
  authDomain: "homifi-4d283.firebaseapp.com",
  projectId: "homifi-4d283",
  storageBucket: "homifi-4d283.appspot.com",
  messagingSenderId: "434013049134",
  appId: "1:434013049134:web:a_unique_hash_from_firebase"
};


const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingPgListings, setPendingPgListings] = useState([]);
  const [rejectedPgListings, setRejectedPgListings] = useState([]);
  const [acceptedPgListings, setAcceptedPgListings] = useState([]); // NEW: State for accepted PG listings
  const [allCombinedPgListings, setAllCombinedPgListings] = useState([]); // NEW: Combined list for 'All PGs' view
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPg, setSelectedPg] = useState(null);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [activeSection, setActiveSection] = useState('all'); // UPDATED: Default to 'all'

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Message box state
  const [message, setMessage] = useState({ type: '', text: '' });
  const messageBoxRef = useRef(null);

  // Firebase Initialization and Auth
  useEffect(() => {
    try {
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          setAdminEmail(user.email);
        } else {
          navigate('/admin-login');
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      showMessage('error', `Failed to initialize the application: ${error.message}. Please try again.`);
    }
  }, []);

  // Show Message Function
  const showMessage = (type, text) => {
    setMessage({ type, text });
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  // Fetch Pending PG listings
  useEffect(() => {
    if (db && isAuthReady) {
      setLoading(true);
      const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-4d283';
      const q = query(collection(db, `artifacts/${currentAppId}/public/data/admin_pending_pg_verifications`));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingPgListings(listings);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching pending PG listings:", err);
        showMessage('error', "Failed to load pending PG listings. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [db, isAuthReady]);

  // Fetch Rejected PG listings
  useEffect(() => {
    if (db && isAuthReady) {
      setLoading(true);
      const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-4d283';
      const q = query(collection(db, `artifacts/${currentAppId}/public/data/rejected_pg_listings`));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRejectedPgListings(listings);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching rejected PG listings:", err);
        showMessage('error', "Failed to load rejected PG listings. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [db, isAuthReady]);

  // NEW: Fetch Accepted PG listings
  useEffect(() => {
    if (db && isAuthReady) {
      setLoading(true);
      const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-4d283';
      const q = query(collection(db, `artifacts/${currentAppId}/public/data/pg_listings`)); // This is the accepted collection

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAcceptedPgListings(listings);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching accepted PG listings:", err);
        showMessage('error', "Failed to load accepted PG listings. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [db, isAuthReady]);

  // NEW: Combine all listings when any of the source lists change
  useEffect(() => {
    // Create a Map to store unique PGs by ID, prioritizing accepted, then pending, then rejected
    const combinedMap = new Map();

    // Add accepted PGs first (they are the final state)
    acceptedPgListings.forEach(pg => combinedMap.set(pg.id, pg));
    // Add pending PGs, only if not already in accepted
    pendingPgListings.forEach(pg => {
      if (!combinedMap.has(pg.id)) {
        combinedMap.set(pg.id, pg);
      }
    });
    // Add rejected PGs, only if not already in accepted or pending
    rejectedPgListings.forEach(pg => {
      if (!combinedMap.has(pg.id)) {
        combinedMap.set(pg.id, pg);
      }
    });

    setAllCombinedPgListings(Array.from(combinedMap.values()));
  }, [pendingPgListings, rejectedPgListings, acceptedPgListings]);


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        navigate('/admin-login');
      } catch (error) {
        console.error("Error logging out:", error);
        showMessage('error', "Failed to log out. Please try again.");
      }
    }
  };

  const handleResetPassword = async () => {
    if (auth && adminEmail) {
      try {
        setLoading(true);
        await sendPasswordResetEmail(auth, adminEmail);
        showMessage('success', `Password reset email sent to ${adminEmail}. Please check your inbox.`);
      } catch (error) {
        console.error("Error sending password reset email:", error);
        let errorMessage = "Failed to send password reset email.";
        if (error.code === 'auth/user-not-found') {
          errorMessage = "No user found with this email.";
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = "Invalid email format.";
        }
        showMessage('error', errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      showMessage('error', "Admin email not available for password reset.");
    }
  };

  const handleViewDetails = (pg) => {
    setSelectedPg(pg);
  };

  const handleCloseDetails = () => {
    setSelectedPg(null);
  };

  // Function to accept a PG listing
  const acceptPg = async (pgId, pgData) => {
    if (!db) {
      showMessage('error', "Database not initialized.");
      return;
    }
    setLoading(true);
    const batch = writeBatch(db);
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-4d283';

    try {
      // 1. Delete from admin_pending_pg_verifications (if it exists there)
      const pendingRef = doc(db, `artifacts/${currentAppId}/public/data/admin_pending_pg_verifications`, pgId);
      batch.delete(pendingRef);
      console.log(`Attempting to delete from admin_pending_pg_verifications: ${pgId}`);

      // 2. Delete from rejected_pg_listings (if it exists there)
      const rejectedRef = doc(db, `artifacts/${currentAppId}/public/data/rejected_pg_listings`, pgId);
      batch.delete(rejectedRef);
      console.log(`Attempting to delete from rejected_pg_listings: ${pgId}`);

      // 3. Add/Set to public pg_listings (for accepted PGs)
      const publicPgRef = doc(db, `artifacts/${currentAppId}/public/data/pg_listings`, pgId);
      batch.set(publicPgRef, { ...pgData, status: 'accepted', updatedAt: new Date() });
      console.log(`Added/Updated in public pg_listings: ${pgId}`);

      // 4. Update owner's private pg_listings
      if (pgData.ownerId) {
        const ownerPgRef = doc(db, `artifacts/${currentAppId}/users/${pgData.ownerId}/pg_listings`, pgId);
        batch.update(ownerPgRef, { status: 'accepted', updatedAt: new Date() });
        console.log(`Updated owner's private pg_listings: ${pgId}`);
      } else {
        console.warn("Owner ID not found for PG listing, status not updated in owner's private collection.");
      }

      await batch.commit();
      showMessage('success', `PG "${pgData.pgName}" has been accepted and moved to public listings.`);
      console.log(`PG ${pgData.pgName} (${pgId}) accepted successfully.`);

    } catch (e) {
      console.error(`Error accepting PG ${pgId}: `, e);
      showMessage('error', `Failed to accept PG "${pgData.pgName}".`);
    } finally {
      setLoading(false);
    }
  };

  // Function to reject a PG listing
  const rejectPg = async (pgId, pgData) => {
    if (!db) {
      showMessage('error', "Database not initialized.");
      return;
    }
    setLoading(true);
    const batch = writeBatch(db);
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-4d283';

    try {
      // 1. Delete from admin_pending_pg_verifications (if it exists there)
      const pendingRef = doc(db, `artifacts/${currentAppId}/public/data/admin_pending_pg_verifications`, pgId);
      batch.delete(pendingRef);
      console.log(`Attempting to delete from admin_pending_pg_verifications: ${pgId}`);

      // 2. Delete from public pg_listings (if it was previously accepted and now being rejected)
      const publicPgRef = doc(db, `artifacts/${currentAppId}/public/data/pg_listings`, pgId);
      batch.delete(publicPgRef);
      console.log(`Attempting to delete from public pg_listings: ${pgId}`);

      // 3. Add/Set to rejected_pg_listings
      const rejectedPgRef = doc(db, `artifacts/${currentAppId}/public/data/rejected_pg_listings`, pgId);
      batch.set(rejectedPgRef, { ...pgData, status: 'rejected', updatedAt: new Date() });
      console.log(`Added/Updated in rejected_pg_listings: ${pgId}`);

      // 4. Update owner's private pg_listings
      if (pgData.ownerId) {
        const ownerPgRef = doc(db, `artifacts/${currentAppId}/users/${pgData.ownerId}/pg_listings`, pgId);
        batch.update(ownerPgRef, { status: 'rejected', updatedAt: new Date() });
        console.log(`Updated owner's private pg_listings: ${pgId}`);
      } else {
        console.warn("Owner ID not found for PG listing, status not updated in owner's private collection.");
      }

      await batch.commit();
      showMessage('info', `PG "${pgData.pgName}" has been rejected and moved to rejected listings.`);
      console.log(`PG ${pgData.pgName} (${pgId}) rejected successfully.`);

    } catch (e) {
      console.error(`Error rejecting PG ${pgId}: `, e);
      showMessage('error', `Failed to reject PG "${pgData.pgName}".`);
    } finally {
      setLoading(false);
    }
  };

  // Function to re-verify a rejected PG (move to pending)
  const reverifyPg = async (pgId, pgData) => {
    if (!db) {
      showMessage('error', "Database not initialized.");
      return;
    }
    setLoading(true);
    const batch = writeBatch(db);
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'homifi-4d283';

    try {
      // 1. Delete from rejected_pg_listings
      const rejectedRef = doc(db, `artifacts/${currentAppId}/public/data/rejected_pg_listings`, pgId);
      batch.delete(rejectedRef);
      console.log(`Deleted from rejected_pg_listings: ${pgId}`);

      // 2. Add/Set to admin_pending_pg_verifications (with status 'pending')
      const pendingRef = doc(db, `artifacts/${currentAppId}/public/data/admin_pending_pg_verifications`, pgId);
      batch.set(pendingRef, { ...pgData, status: 'pending', updatedAt: new Date() });
      console.log(`Added/Updated in admin_pending_pg_verifications: ${pgId}`);

      // 3. Update owner's private pg_listings
      if (pgData.ownerId) {
        const ownerPgRef = doc(db, `artifacts/${currentAppId}/users/${pgData.ownerId}/pg_listings`, pgId);
        batch.update(ownerPgRef, { status: 'pending', updatedAt: new Date() });
        console.log(`Updated owner's private pg_listings: ${pgId}`);
      } else {
        console.warn("Owner ID not found for PG listing, status not updated in owner's private collection.");
      }

      await batch.commit();
      showMessage('success', `PG "${pgData.pgName}" has been moved back to pending for re-verification.`);
      console.log(`PG ${pgData.pgName} (${pgId}) moved to pending successfully.`);

    } catch (e) {
      console.error(`Error re-verifying PG ${pgId}: `, e);
      showMessage('error', `Failed to move PG "${pgData.pgName}" to pending.`);
    } finally {
      setLoading(false);
    }
  };


  const filteredPgListings = (() => {
    let sourceList;
    if (activeSection === 'pending') {
      sourceList = pendingPgListings;
    } else if (activeSection === 'rejected') {
      sourceList = rejectedPgListings;
    } else { // 'all'
      sourceList = allCombinedPgListings;
    }

    return sourceList.filter(pg =>
      pg.pgName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pg.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pg.pgOwnerEmail && pg.pgOwnerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      pg.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  })();

  // Close sidebar/message box if clicked outside
  const sidebarRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      if (messageBoxRef.current && !messageBoxRef.current.contains(event.target) && message.text) {
        setMessage({ type: '', text: '' });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, message.text]);


  if (!isAuthReady) {
    return (
      <div className="pg-owner-dashboard-wrapper">
        <p className="loading-message" style={{ textAlign: 'center', color: 'white' }}>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="pg-owner-dashboard-wrapper">
      <style>
        {`
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
              flex-direction: column;
              min-height: 100vh; /* Keep min-height for overall page structure */
              background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
              color: var(--bg-white);
          }

          /* Top Navigation Bar */
          .top-nav-bar {
              background-color: var(--homifi-darker-blue);
              padding: 0.8rem 2rem; /* Increased horizontal padding */
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: var(--shadow-md);
              z-index: 1000;
          }

          .top-nav-left {
              display: flex;
              align-items: center;
          }

          .homifi-logo-text {
              font-size: 1.8rem; /* Adjust as needed */
              font-weight: 700;
              color: var(--homifi-teal);
              margin-right: 1.2rem;
          }

          .top-nav-right {
              display: flex;
              align-items: center;
          }

          .top-nav-menu {
              list-style: none;
              margin: 0;
              padding: 0;
              display: flex;
              gap: 1.8rem; /* Increased gap */
          }

          .top-nav-menu-item {
              color: var(--bg-white);
              font-weight: 500;
              cursor: pointer;
              transition: color 0.2s ease, transform 0.2s ease;
              display: flex;
              align-items: center;
              gap: 0.6rem;
              font-size: 1.05rem; /* Slightly larger font */
          }

          .top-nav-menu-item:hover {
              color: var(--homifi-teal);
              transform: translateY(-2px); /* Subtle lift effect */
          }

          .profile-menu-item {
              padding: 0.5rem 0;
          }
          .top-nav-menu-item svg {
              font-size: 1.3rem; /* Ensure icons are clear */
          }

          /* Right Sidebar */
          .profile-sidebar {
              position: fixed;
              top: 0;
              right: -280px; /* Adjusted from -320px for narrower width */
              width: 260px; /* Adjusted from 300px for narrower width */
              height: 100%;
              background-color: var(--homifi-darker-blue);
              color: var(--bg-white);
              box-shadow: -6px 0 15px rgba(0, 0, 0, 0.25); /* Stronger, softer shadow */
              transition: right 0.3s ease-in-out;
              z-index: 1100;
              display: flex;
              flex-direction: column;
              padding: 1.5rem 1rem; /* Adjusted from 2rem 1.5rem for less padding */
          }

          .profile-sidebar.open {
              right: 0;
          }

          .sidebar-close-button {
              background: none;
              border: none;
              color: var(--bg-white);
              font-size: 2rem; /* Adjusted from 2.2rem for slightly smaller */
              align-self: flex-end;
              cursor: pointer;
              margin-bottom: 1rem; /* Adjusted from 1.5rem for less space */
              transition: color 0.2s ease, transform 0.2s ease;
          }

          .sidebar-close-button:hover {
              color: var(--error-red);
              transform: rotate(90deg); /* Spin effect */
          }

          .sidebar-content {
              display: flex;
              flex-direction: column;
              gap: 0.8rem; /* Adjusted from 1.2rem for less gap */
              flex-grow: 1;
          }

          .sidebar-user-email {
              font-size: 1rem; /* Adjusted from 1.1rem for slightly smaller */
              font-weight: 600;
              margin-bottom: 1.5rem; /* Adjusted from 2rem for less space */
              color: var(--homifi-teal); /* Use a distinct color for the email/name */
              text-align: center;
              word-wrap: break-word; /* Ensure long emails wrap */
          }

          .sidebar-button {
              background-color: var(--homifi-dark-blue);
              color: var(--bg-white);
              border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border */
              padding: 0.7rem 1rem; /* Adjusted from 0.9rem 1.2rem for less padding */
              border-radius: var(--border-radius-medium);
              display: flex;
              align-items: center;
              gap: 0.8rem; /* Adjusted from 1rem for less space for icons */
              font-size: 1rem; /* Adjusted from 1.05rem for slightly smaller */
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
              text-decoration: none; /* For potential future links */
          }

          .sidebar-button:hover, .sidebar-button.active {
              background-color: var(--homifi-cyan);
              color: var(--homifi-dark-blue);
              transform: translateX(6px); /* Adjusted from 8px for less pronounced slide */
              box-shadow: var(--shadow-md); /* Clearer shadow */
          }

          .sidebar-button svg {
              color: var(--homifi-teal); /* Initial color for icons */
              font-size: 1.15rem; /* Adjusted from 1.25rem for slightly smaller icons */
              transition: color 0.3s ease;
          }

          .sidebar-button:hover svg, .sidebar-button.active svg {
              color: var(--homifi-dark-blue); /* Color on hover */
          }

          /* Notification Badge for Bell icon */
          .notification-badge {
              background-color: var(--error-red); /* Red circle for unread count */
              color: white;
              border-radius: 50%;
              padding: 0.2rem 0.5rem;
              font-size: 0.75rem;
              font-weight: 700;
              position: absolute; /* Position relative to the parent bell icon/button */
              top: 5px;
              right: 5px;
              min-width: 20px;
              text-align: center;
              line-height: 1.2;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }

          /* New Content Area for Form and Listings */
          .dashboard-content-area {
              flex-grow: 1;
              padding: 2.5rem;
              max-width: 1200px;
              /* Removed margin: 2.5rem auto; */
              padding-top: 1.5rem; /* Explicit padding from top - REDUCED */
              width: 100%;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              gap: 1.5rem; /* REDUCED GAP */
              align-items: center; /* Re-enabled for horizontal centering */
              justify-content: flex-start; /* Aligns content to the top */
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
              z-index: 1500; /* Higher than notification popup */
              animation: fadeIn 0.3s ease-out;
          }

          .app-message-box {
              background-color: var(--bg-white);
              color: var(--text-dark);
              padding: 1.5rem 2rem; /* More padding for a popup */
              border-radius: var(--border-radius-large); /* Larger radius for popup */
              box-shadow: var(--shadow-lg); /* More prominent shadow for popup */
              width: 90%;
              max-width: 450px; /* Max width for message popup */
              position: relative;
              display: flex;
              flex-direction: column; /* Stack message and button */
              align-items: center;
              text-align: center;
              border: 1px solid transparent;
              animation: slideInFromTop 0.3s ease-out;
          }

          .app-message-box p {
              margin: 0 0 1rem 0; /* Add margin below message */
              font-size: 1.1rem; /* Slightly larger font */
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
              margin-top: 0.5rem; /* Space from message */
          }

          .app-message-box-close-button:hover {
              background-color: #27c2b6;
              transform: translateY(-2px);
          }


          /* PG Details Form Card (repurposed for Admin Listings Card) */
          .pg-details-form-card,
          .admin-listings-section { /* Renamed owner-listings-section to admin-listings-section for Admin context */
              background-color: var(--bg-card);
              color: var(--text-dark);
              padding: 2.5rem; /* Increased padding */
              border-radius: var(--border-radius-large);
              box-shadow: var(--shadow-lg); /* More prominent shadow for cards */
              width: 100%; /* Ensure it takes full width within its parent */
              max-width: 900px; /* Adjusted max-width for admin listings */
              box-sizing: border-box; /* Include padding in width calculation */
              margin: 0 auto; /* Center the card itself */
          }

          .form-title,
          .section-title {
              font-size: 2rem; /* Larger titles */
              color: var(--homifi-teal); /* Changed to teal */
              margin-bottom: 2rem; /* Increased margin */
              text-align: center;
              font-weight: 700;
          }

          /* Search Bar */
          .search-bar-container {
              margin-bottom: 1rem; /* REDUCED MARGIN */
              display: flex;
              /* Removed justify-content: center; as parent handles it */
              width: 100%;
              max-width: 800px; /* Match main content width */
          }

          .search-input {
              width: 100%;
              padding: 0.85rem 1.1rem;
              border: 1px solid var(--border-light);
              border-radius: var(--border-radius-medium);
              font-size: var(--font-size-base);
              box-sizing: border-box;
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
              color: var(--text-dark);
              background-color: var(--bg-white);
          }

          .search-input:focus {
              border-color: var(--homifi-teal);
              box-shadow: 0 0 0 4px rgba(45, 202, 181, 0.25);
              outline: none;
          }

          /* PG Listings Grid */
          .listings-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: 1.5rem;
              margin-top: 1.8rem;
          }

          .listing-card {
              border: 1px solid var(--border-light);
              border-radius: var(--border-radius-large); /* Larger radius for cards */
              padding: 1.5rem;
              background-color: var(--bg-light-grey);
              box-shadow: var(--shadow-sm); /* Softer shadow */
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
              transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .listing-card:hover {
              transform: translateY(-4px);
              box-shadow: var(--shadow-md); /* More pronounced shadow on hover */
          }

          .listing-card.accepted {
              border-left: 5px solid var(--success-green);
          }

          .listing-card.pending {
              border-left: 5px solid var(--warning-orange);
          }

          .listing-card.rejected {
              border-left: 5px solid var(--error-red);
          }

          .pg-info {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
              margin-bottom: 0.5rem;
          }

          .pg-name {
              font-size: 1.2rem;
              font-weight: 600;
              color: var(--homifi-dark-blue);
          }

          .pg-owner-email {
              font-size: 0.9rem;
              color: var(--text-medium);
          }

          .pg-status {
              font-size: 0.9rem;
              font-weight: 600;
          }

          .listing-card.accepted .pg-status { color: var(--success-green); }
          .listing-card.pending .pg-status { color: var(--warning-orange); }
          .listing-card.rejected .pg-status { color: var(--error-red); }

          .pg-actions {
              display: flex;
              gap: 0.75rem;
              flex-wrap: wrap;
              margin-top: 1rem;
              border-top: 1px solid var(--border-subtle);
              padding-top: 1rem;
          }

          .pg-actions button {
              padding: 0.6rem 1.2rem;
              border: none;
              border-radius: var(--border-radius-medium);
              font-size: 0.9rem;
              font-weight: 600;
              cursor: pointer;
              transition: background-color 0.3s ease, transform 0.2s ease;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .view-button {
              background-color: var(--homifi-cyan);
              color: var(--bg-white);
          }

          .view-button:hover:not(:disabled) {
              background-color: #007bb3;
              transform: translateY(-1px);
          }

          .accept-button {
              background-color: var(--success-green);
              color: var(--bg-white);
          }

          .accept-button:hover:not(:disabled) {
              background-color: #218838;
              transform: translateY(-1px);
          }

          .reject-button {
              background-color: var(--error-red);
              color: var(--bg-white);
          }

          .reject-button:hover:not(:disabled) {
              background-color: #c0392b;
              transform: translateY(-1px);
          }
          .reverify-button {
              background-color: var(--warning-orange); /* Orange for reverify */
              color: var(--bg-white);
          }

          .reverify-button:hover:not(:disabled) {
              background-color: #e0a800; /* Darker orange on hover */
              transform: translateY(-1px);
          }
          .force-accept-button {
              background-color: var(--homifi-teal); /* Teal for force accept */
              color: var(--homifi-dark-blue);
          }

          .force-accept-button:hover:not(:disabled) {
              background-color: #27c2b6; /* Darker teal on hover */
              transform: translateY(-1px);
          }


          /* Modal Styles */
          .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.6);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 2000; /* Above sidebar */
              animation: fadeIn 0.3s ease-out;
          }

          .modal-content {
              background-color: var(--bg-white);
              border-radius: var(--border-radius-large); /* Larger radius */
              padding: 2.5rem;
              max-width: 700px;
              width: 90%;
              max-height: 90vh;
              overflow-y: auto;
              box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
              position: relative;
              color: var(--text-dark);
              animation: slideInFromTop 0.3s ease-out;
          }

          .modal-close-button {
              position: absolute;
              top: 15px;
              right: 15px;
              background: none;
              border: none;
              font-size: 2rem;
              cursor: pointer;
              color: var(--text-light);
              transition: color 0.2s ease;
          }

          .modal-close-button:hover {
              color: var(--error-red);
          }

          .modal-content h3 {
              color: var(--homifi-dark-blue);
              margin-top: 0;
              margin-bottom: 1.5rem;
              font-size: 1.8rem;
          }

          .modal-content p {
              margin-bottom: 0.8rem;
              line-height: 1.5;
          }

          .modal-content strong {
              color: var(--text-dark);
          }

          .modal-content ul {
              list-style: none;
              padding: 0;
              margin-bottom: 1rem;
          }

          .modal-content ul li {
              margin-bottom: 0.5rem;
              background-color: var(--bg-light-grey);
              padding: 0.5rem 1rem;
              border-radius: 6px;
              border: 1px solid var(--border-subtle);
          }

          .modal-photos-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
              gap: 1rem;
              margin-top: 1.5rem;
              border-top: 1px solid var(--border-light);
              padding-top: 1.5rem;
          }

          .modal-photo-item {
              border: 1px solid var(--border-light);
              border-radius: 8px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
          }

          .modal-photo-image {
              width: 100%;
              height: 120px;
              object-fit: cover;
              border-bottom: 1px solid var(--border-subtle);
          }

          /* New style for placeholder image */
          .modal-photo-image.placeholder {
              background-color: var(--bg-light-grey); /* A light grey background */
              display: flex;
              justify-content: center;
              align-items: center;
              color: var(--text-light);
              font-size: 0.9rem;
              text-align: center;
          }


          .modal-photo-caption {
              width: 100%;
              padding: 0.5rem;
              font-size: 0.8rem;
              text-align: center;
              color: var(--text-medium);
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

          /* Responsive Adjustments */
          @media (max-width: 992px) {
              .top-nav-bar {
                  padding: 0.8rem 1.5rem;
              }
              .homifi-logo-text {
                  font-size: 1.5rem;
              }
              .top-nav-menu-item span {
                  display: none;
              }
              .top-nav-menu-item svg {
                  margin-right: 0;
                  font-size: 1.2rem;
              }

              .dashboard-content-area {
                  padding: 1.5rem;
                  margin: 1.5rem auto;
                  gap: 1.5rem;
              }

              .listings-grid {
                  grid-template-columns: 1fr;
              }

              .pg-details-form-card,
              .admin-listings-section {
                  padding: 2rem;
              }
              .modal-content {
                  padding: 1.5rem;
              }
              .modal-content h3 {
                  font-size: 1.5rem;
              }
              .modal-close-button {
                  font-size: 1.8rem;
              }
          }

          @media (max-width: 768px) {
              .pg-details-form-card,
              .admin-listings-section {
                  padding: 1.5rem;
              }

              .section-title {
                  font-size: 1.6rem;
                  margin-bottom: 1.2rem;
              }
              .app-message-box {
                  padding: 1.2rem 1.5rem; /* Adjusted for smaller screens */
                  font-size: 0.9rem;
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
              .pg-details-form-card,
              .admin-listings-section {
                  padding: 1rem;
              }
              .section-title {
                  font-size: 1.25rem;
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
        `}
      </style>
      {/* Top Navigation Bar */}
      <nav className="top-nav-bar">
        <div className="top-nav-left">
          <span className="homifi-logo-text">HomiFi Admin</span>
        </div>
        <div className="top-nav-right">
          <ul className="top-nav-menu">
            <li className="top-nav-menu-item profile-menu-item" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <User size={24} />
              <span>Profile</span>
            </li>
          </ul>
        </div>
      </nav>

      {/* Right Sidebar for Profile */}
      <div ref={sidebarRef} className={`profile-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close-button" onClick={() => setIsSidebarOpen(false)}>
          &times;
        </button>
        <div className="sidebar-content">
          <p className="sidebar-user-email">Welcome, {adminEmail || 'Admin User'}</p>

          {/* NEW: All PGs Button */}
          <button
            onClick={() => { setActiveSection('all'); setIsSidebarOpen(false); }}
            className={`sidebar-button ${activeSection === 'all' ? 'active' : ''}`}
            onMouseEnter={() => setHoveredButton('all')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <List size={20} /> {/* Icon for All PGs */}
            <span>{hoveredButton === 'all' ? 'All Listings' : 'All PGs'}</span>
          </button>

          {/* Pending PGs Button */}
          <button
            onClick={() => { setActiveSection('pending'); setIsSidebarOpen(false); }}
            className={`sidebar-button ${activeSection === 'pending' ? 'active' : ''}`}
            onMouseEnter={() => setHoveredButton('pending')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Bell size={20} />
            <span>{hoveredButton === 'pending' ? 'Pending Verifications' : 'Pending PGs'}</span>
          </button>

          {/* Rejected PGs Button */}
          <button
            onClick={() => { setActiveSection('rejected'); setIsSidebarOpen(false); }}
            className={`sidebar-button ${activeSection === 'rejected' ? 'active' : ''}`}
            onMouseEnter={() => setHoveredButton('rejected')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <XCircle size={20} />
            <span>{hoveredButton === 'rejected' ? 'Rejected Listings' : 'Rejected PGs'}</span>
          </button>

          {/* Reset Password Button */}
          <button
            onClick={() => { handleResetPassword(); setIsSidebarOpen(false); }}
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('reset-password')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Key size={20} />
            <span>{hoveredButton === 'reset-password' ? 'Change Password' : 'Reset Password'}</span>
          </button>

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

      {/* Main Content */}
      <div className="dashboard-content-area">
        {/* Message Box as a Popup */}
        {message.text && (
          <div className="message-popup-overlay">
            <div ref={messageBoxRef} className={`app-message-box ${message.type}`}>
              <p>{message.text}</p>
              <button className="app-message-box-close-button" onClick={() => setMessage({ type: '', text: '' })}>OK</button>
            </div>
          </div>
        )}

        <h1 className="section-title">Admin Dashboard</h1>

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
        {loading && <p className="loading-message">Fetching {activeSection === 'all' ? 'all' : activeSection === 'pending' ? 'pending' : 'rejected'} PG listings...</p>}

        <div className="admin-listings-section">
          <h2 className="section-title">
            {activeSection === 'all' && 'All PG Listings'}
            {activeSection === 'pending' && 'PG Listings for Verification'}
            {activeSection === 'rejected' && 'Rejected PG Listings'}
          </h2>
          {filteredPgListings.length === 0 && !loading && (
            <p className="text-center" style={{ color: 'var(--text-medium)' }}>
              No {activeSection === 'all' ? 'PG' : activeSection === 'pending' ? 'pending' : 'rejected'} listings found.
            </p>
          )}
          <div className="listings-grid">
            {filteredPgListings.map(pg => (
              <div key={pg.id} className={`listing-card ${pg.status}`}>
                <div className="pg-info">
                  <span className="pg-name">{pg.pgName}</span>
                  <span className="pg-owner-email">{pg.pgOwnerEmail}</span>
                  <span className="pg-status">Status: {pg.status?.toUpperCase()}</span>
                </div>
                <div className="pg-actions">
                  <button onClick={() => handleViewDetails(pg)} className="button button-outline button-small view-button">View Details</button>
                  {pg.status === 'pending' && (
                    <>
                      <button onClick={() => acceptPg(pg.id, pg)} className="button button-primary button-small accept-button" disabled={loading}>Accept</button>
                      <button onClick={() => rejectPg(pg.id, pg)} className="button button-secondary button-small reject-button" disabled={loading}>Reject</button>
                    </>
                  )}
                  {pg.status === 'rejected' && (
                    <>
                      <button onClick={() => reverifyPg(pg.id, pg)} className="button button-small reverify-button" disabled={loading}>Re-verify</button>
                      <button onClick={() => acceptPg(pg.id, pg)} className="button button-small force-accept-button" disabled={loading}>Accept Directly</button> {/* Changed to acceptPg */}
                    </>
                  )}
                  {pg.status === 'accepted' && (
                    <>
                      {/* You can add actions for accepted PGs here, e.g., 'Unpublish' or 'Mark as Rejected' */}
                      <button onClick={() => rejectPg(pg.id, pg)} className="button button-secondary button-small reject-button" disabled={loading}>Mark as Rejected</button>
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
                {selectedPg.sharingOptions && selectedPg.sharingOptions.map((option, index) => (
                  <li key={index}>{option.type}: {option.status} - ₹{option.price} {option.hasMess ? '(Mess Included)' : ''}</li>
                ))}
              </ul>
              <p><strong>Facilities:</strong> {selectedPg.facilities && selectedPg.facilities.join(', ')}</p>
              <div className="modal-photos-grid">
                {selectedPg.photos && selectedPg.photos.map((photo, index) => {
                  console.log(`Loading image for ${selectedPg.pgName}, Photo URL ${index + 1}:`, photo.url);
                  return (
                    <div key={index} className="modal-photo-item">
                      <img
                        src={photo.url}
                        alt={photo.caption || `PG Photo ${index + 1}`}
                        className="modal-photo-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://placehold.co/120x120/E0E0E0/777777?text=No+Image";
                          e.target.classList.add('placeholder');
                          console.error(`Failed to load image: ${photo.url}`);
                        }}
                      />
                      {photo.caption && <p className="modal-photo-caption">{photo.caption}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
