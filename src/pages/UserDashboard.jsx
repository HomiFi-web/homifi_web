import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link import
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, deleteDoc, addDoc, serverTimestamp, updateDoc, getDocs, writeBatch, orderBy } from 'firebase/firestore';
import {
  User, LayoutDashboard, Heart, LogOut, Menu, Key, ChevronLeft, ChevronRight, // Existing imports
  Info, Edit, Trash2, PlusCircle, MapPin, Bed, HeartCrack // New imports for icons
} from 'lucide-react';

// Declare global variables for ESLint and provide fallback values
const __initial_auth_token = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : '';
const __app_id = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'homifi-4d283'; // UPDATED: Set fallback to your project ID
const firebaseConfig = typeof window !== 'undefined' && typeof window.__firebase_config !== 'undefined' ? JSON.parse(window.__firebase_config) : {
  apiKey: "AIzaSyCENbG6LtD_dVaNoqyoJuLmx1yTQNi6e0E", // UPDATED: Your Web API Key
  authDomain: "homifi-4d283.firebaseapp.com", // UPDATED: Derived from your Project ID
  projectId: "homifi-4d283", // UPDATED: Your Project ID
  storageBucket: "homifi-4d283.appspot.com", // UPDATED: Derived from your Project ID
  messagingSenderId: "1076632421711", // UPDATED: Your Sender ID
  appId: "1:1076632421711:web:35544047a2963065a2d67d", // UPDATED: Your App ID
  measurementId: "G-XXXXXXXXXX" // UPDATED: Your Measurement ID
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// HeartIconSVG Component - Renders the custom SVG heart icon with animation classes
const HeartIconSVG = ({ isActive, isAnimating }) => {
  return (
    // The button container now has no background, border, or shadow
    <div className={`button ${isActive ? 'active' : ''} ${isAnimating ? 'animate' : ''}`}>
      <svg width="35px" height="25px" viewBox="0 0 35 25" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" fillRule="evenodd">
          {/* heart-stroke: visible when not active, represents the outlined heart */}
          <path className="heart-stroke" d="M13.0185191,4.25291223 L12.9746137,4.25291223 C10.1097846,4.25291223 8.67188189,6.6128289 8.5182129,8.92335198 C8.39747298,10.6740809 8.73225185,12.8528876 14.0777375,18.4782704 C14.7127154,19.1080239 15.5654911,19.4695694 16.4596069,19.4880952 C17.3247917,19.4700909 18.1444718,19.0969678 18.7262246,18.4563177 C19.3189478,17.9074999 24.5052763,12.5894551 24.3570955,8.98921012 C24.2363556,6.42623084 22.123407,4.25291223 19.7525139,4.25291223 C18.5053576,4.22947431 17.3125171,4.76253118 16.4980242,5.70727948 C15.6177331,4.73767759 14.354699,4.20555668 13.04596,4.25291223 L13.0185191,4.25291223 Z" fill="none" stroke="#FFFFFF"/> {/* Changed fill to none and stroke to white */}
          {/* heart-full: visible when active, represents the filled heart */}
          <path className="heart-full" d="M13.0185191,4.25291223 L12.9746137,4.25291223 C10.1097846,4.25291223 8.67188189,6.6128289 8.5182129,8.92335198 C8.39747298,10.6740809 8.73225185,12.8528876 14.0777375,18.4782704 C14.7127154,19.1080239 15.5654911,19.4695694 16.4596069,19.4880952 C17.3247917,19.4700909 18.1444718,19.0969678 18.7262246,18.4563177 C19.3189478,17.9074999 24.5052763,12.5894551 24.3570955,8.98921012 C24.2363556,6.42623084 22.123407,4.25291223 19.7525139,4.25291223 C18.5053576,4.22947431 17.3125171,4.76253118 16.4980242,5.70727948 C15.6177331,4.73767759 14.354699,4.20555668 13.04596,4.25291223 L13.0185191,4.25291223 Z" fill="#E74C3C"/> {/* Changed fill to red */}
          {/* heart-lines: visible during animation */}
          <path className="heart-lines" d="M26,4 L30.6852129,0.251829715" stroke="#2DCAB5" strokeWidth="2" strokeLinecap="round"/> {/* Changed stroke to teal */}
          <path className="heart-lines"d="M2.314788,4 L7.00000086,0.251829715" stroke="#2DCAB5" strokeWidth="2" strokeLinecap="round" transform="matrix(-1 0 0 1 10.314788 1)"/> {/* Changed stroke to teal */}
          <path className="heart-lines" d="M27,12 L33,12" stroke="#2DCAB5" strokeWidth="2" strokeLinecap="round" /> {/* Changed stroke to teal */}
          <path className="heart-lines" d="M0,12 L6,12" stroke="#2DCAB5" strokeWidth="2" strokeLinecap="round" transform="matrix(-1 0 0 1 7 1)"/> {/* Changed stroke to teal */}
          <path className="heart-lines" d="M24,19 L28.6852129,22.7481703" stroke="#2DCAB5" strokeWidth="2" strokeLinecap="round"/> {/* Changed stroke to teal */}
          <path className="heart-lines" d="M4.314788,19 L9.00000086,22.7481703" stroke="#2DCAB5" strokeWidth="2" strokeLinecap="round" transform="matrix(-1 0 0 1 14.314788 1)"/> {/* Changed stroke to teal */}
        </g>
      </svg>
    </div>
  );
};


// ImageCarousel Component - Renders the image carousel for PG cards
const ImageCarousel = ({ photos, pgName }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === (photos?.length || 0) - 1 ? 0 : prevIndex + 1
    );
  }, [photos]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? (photos?.length || 0) - 1 : prevIndex - 1
    );
  }, [photos]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      // Swiped left
      nextImage();
    } else if (touchEndX.current - touchStartX.current > 50) {
      // Swiped right
      prevImage();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (!photos || photos.length === 0) {
    return (
      <img src="https://placehold.co/300x200/E0E0E0/333333?text=No+Image" alt="No Image Available" className="pg-card-image" />
    );
  }

  return (
    <div
      className="image-carousel-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={photos[currentImageIndex]?.url || "https://placehold.co/300x200/E0E0E0/333333?text=No+Image"}
        alt={`${pgName} - Photo ${currentImageIndex + 1}`}
        className="pg-card-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://placehold.co/300x200/E0E0E0/333333?text=Error";
        }}
      />
      {photos.length > 1 && (
        <>
          <button className="carousel-arrow left-arrow" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
            <ChevronLeft size={24} />
          </button>
          <button className="carousel-arrow right-arrow" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
            <ChevronRight size={24} />
          </button>
          <div className="carousel-dots">
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${currentImageIndex === idx ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
              ></span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// MessageBox Class - Adapted from the provided HTML/SCSS/JS for notifications
class MessageBox {
  constructor(option) {
    this.option = option;
    
    this.msgBoxArea = document.querySelector("#msgbox-area");
    
    if (this.msgBoxArea === null) {
      this.msgBoxArea = document.createElement("DIV");
      this.msgBoxArea.setAttribute("id", "msgbox-area");
      this.msgBoxArea.classList.add("msgbox-area");
      
      document.body.appendChild(this.msgBoxArea);
    }
  }
  
  // Modified show method to accept a 'type' for styling
  show(msg, type = 'info', callback, closeLabel) { // Default type to 'info'
    if (msg === "" || msg === undefined || msg === null) {
      throw "Message is empty or not defined.";
    }
    
    if (closeLabel === undefined || closeLabel === null) {
      closeLabel = "Close";
    }
    
    const option = this.option;

    const msgboxBox = document.createElement("DIV");
    const msgboxContent = document.createElement("DIV");
    const msgboxCommand = document.createElement("DIV");
    const msgboxClose = document.createElement("A");
    
    msgboxContent.classList.add("msgbox-content");
    msgboxContent.innerText = msg;
    
    msgboxCommand.classList.add("msgbox-command");
    
    msgboxClose.classList.add("msgbox-close");
    msgboxClose.setAttribute("href", "#");
    msgboxClose.innerText = closeLabel;
    
    msgboxBox.classList.add("msgbox-box");
    msgboxBox.classList.add(`msgbox-box-${type}`); // Add type-specific class
    msgboxBox.appendChild(msgboxContent);

    if (option.hideCloseButton === false || option.hideCloseButton === undefined) {
      msgboxCommand.appendChild(msgboxClose);
      msgboxBox.appendChild(msgboxCommand);
    }

    this.msgBoxArea.appendChild(msgboxBox);
    
    // Add 'msgbox-box-show' class after a slight delay to trigger the pop-in animation
    setTimeout(() => {
        msgboxBox.classList.add("msgbox-box-show");
    }, 10); // Small delay to allow initial render before transition

    msgboxClose.onclick = (evt) => {
      evt.preventDefault();
      
      if (msgboxBox.classList.contains("msgbox-box-hide")) {
        return;
      }
      
      clearTimeout(this.msgboxTimeout);
      
      this.msgboxTimeout = null;

      this.hide(msgboxBox, callback);
    };

    if (option.closeTime > 0) {
      this.msgboxTimeout = setTimeout(() => {
        this.hide(msgboxBox, callback);
      }, option.closeTime);
    }
  }
  
  hideMessageBox(msgboxBox) {
    return new Promise(resolve => {
      msgboxBox.ontransitionend = () => {
        resolve();
      };
    });
  }
  
  async hide(msgboxBox, callback) {
    if (msgboxBox !== null) {
      msgboxBox.classList.add("msgbox-box-hide");
      msgboxBox.classList.remove("msgbox-box-show"); // Ensure show class is removed
    }
    
    await this.hideMessageBox(msgboxBox);
    
    if (this.msgBoxArea.contains(msgboxBox)) { // Check if child exists before removing
        this.msgBoxArea.removeChild(msgboxBox);
    }

    clearTimeout(this.msgboxTimeout);
    
    if (typeof callback === "function") {
      callback();
    }
  }
}


const UserDashboard = () => {
  const navigate = useNavigate();
  const [allPgListings, setAllPgListings] = useState([]); // State for all accepted PG listings
  // Removed myPgListings state
  const [wishlistedPgMeta, setWishlistedPgMeta] = useState(new Map()); // Map to store pgId -> wishlistDocId for efficient removal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sidebar and active section states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard', 'wishlist'

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(''); // To display user's email in profile
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Ref for MessageBox instance
  const messageBoxRef = useRef(null);

  // Ref for the sidebar element to handle outside clicks
  const sidebarRef = useRef(null);


  // State to manage animation for each heart icon
  const [animatingHearts, setAnimatingHearts] = useState({});


  // Firebase Initialization and Auth
  useEffect(() => {
    try {
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp(); // Initialize only if not already initialized
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      // Initialize MessageBox only once
      if (!messageBoxRef.current) {
        messageBoxRef.current = new MessageBox({
          closeTime: 2000, // Auto-close after 2 seconds
          hideCloseButton: true // Hide close button for toast-like behavior
        });
      }

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

  // Removed useEffect for fetching current user's own PG listings

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
        displayMessage(`Failed to log out: ${error.message}`, 'error');
      }
    }
  };

  const handleToggleWishlist = async (pgId) => {
    if (!userId) {
        navigate('/login'); // Redirect to login if not authenticated
        return;
    }
    if (!db) {
        displayMessage("Database not initialized. Please try again.", 'error');
        return;
    }

    // Trigger animation
    setAnimatingHearts(prev => ({ ...prev, [pgId]: true }));
    setTimeout(() => {
      setAnimatingHearts(prev => ({ ...prev, [pgId]: false }));
    }, 500); // Animation duration is approx 0.5s for heart + lines

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
        displayMessage("Failed to update wishlist. Please try again.", 'error');
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
    : allPgListings; // Default to all accepted listings for 'dashboard'

  // Function to display messages to the user using the new MessageBox
  const displayMessage = (text, type, duration = 2000) => { // Default duration to 2 seconds
    if (messageBoxRef.current) {
      messageBoxRef.current.show(text, type, null, 'Close'); // Pass type to MessageBox
    } else {
      console.warn("MessageBox not initialized. Cannot display message:", text);
      // Fallback for console if MessageBox isn't ready
      if (type === 'error') {
        setError(text);
      }
    }
  };

  // Profile button in top nav will open sidebar and set active section to dashboard
  const handleProfileClick = () => {
    setIsSidebarOpen(true); // Open sidebar
  };

  const handleDashboardClick = () => {
    setActiveSection('dashboard');
    setIsSidebarOpen(false); // Close sidebar after selection
    displayMessage('Browse available PG listings.', 'info', 2000);
  };

  const handleWishlistClick = () => {
    setActiveSection('wishlist');
    setIsSidebarOpen(false); // Close sidebar after selection
    displayMessage('Viewing your wishlisted PGs.', 'info', 2000);
  };

  // Removed handleMyListingsClick function

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

  // Removed handleAddPgClick, handleEditPg, confirmDeletePg functions

  // Close sidebar if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ensure sidebarRef.current exists before trying to use it
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);


  if (!isAuthReady) {
    return (
      <div className="pg-owner-dashboard-wrapper">
        <p className="loading-message">Loading User Dashboard...</p>
      </div>
    );
  }

  // Determine the title to display in the top navigation bar
  const getHeaderTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Browse Available PGs';
      case 'wishlist':
        return 'My Wishlisted PGs';
      default:
        return 'HomiFi';
    }
  };


  return (
    <div className="pg-owner-dashboard-wrapper">
      {/* Embedded CSS for this component */}
      <style>{`
        /* Define HomiFi Color Palette as CSS Variables - Enhanced for Professional Look */
        :root {
            --homifi-dark-blue: #20143b;
            --homifi-teal: #30D5C8;
            --homifi-cyan: #00BCD4;
            --homifi-darker-blue: #000069;
            --homifi-deepest-blue: #000040;

            --success-green: #28a745;
            --error-red: #dc3545;
            --warning-orange: #ffc107;

            --bg-light-grey: #f8f9fa;
            --bg-white: #ffffff;
            --bg-soft-blue: #e0f7fa;
            --bg-card: #ffffff;
            --bg-gradient-start: #20143b;
            --bg-gradient-end: #000040;

            /* Fonts */
            --font-primary: 'Inter', sans-serif;
            --font-heading: 'Poppins', sans-serif;
        }

        /* Base Styles */
        body {
            font-family: var(--font-primary);
            line-height: 1.6;
            color: #333333;
            background-color: var(--bg-light-grey);
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow-x: hidden; /* Prevent horizontal scrolling on the body */
        }

        /* Overall Dashboard Container */
        .pg-owner-dashboard-wrapper {
            background-color: var(--bg-light-grey);
            font-family: var(--font-primary);
            min-height: 100vh;
            color: #333333;
            position: relative; /* Needed for sidebar positioning */
            overflow-x: hidden; /* Prevent horizontal scrolling on the wrapper */
        }

        /* Header Styles (from GuestDashboard and provided Header.jsx) */
        .navbar {
            background-color: var(--homifi-dark-blue);
            color: white;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            position: fixed;
            width: 100%;
            top: 0;
            left: 0;
            z-index: 1000;
            box-sizing: border-box; /* Ensure padding is included in width */
        }

        .navbar .container { /* Adjust container within navbar if needed */
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .logo-link {
            display: flex;
            align-items: center;
            text-decoration: none;
            color: inherit;
        }

        .logo-img {
            height: 40px; /* Adjusted from 50px for a more compact header */
            margin-right: 10px;
        }

        /* Removed .navbar-brand and .logo-tagline styles */

        .nav-links { /* Container for About Us, Contact Us */
            display: flex;
            gap: 1.5rem;
            margin-left: auto; /* Push these links to the right */
        }

        .nav-link {
            color: white;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
            white-space: nowrap;
        }

        .nav-link:hover {
            color: var(--homifi-teal);
        }

        .profile-button-top-nav { /* Profile button on the far right */
            background-color: var(--homifi-teal); /* Changed to teal for prominence */
            color: var(--homifi-dark-blue);
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-left: 1.5rem; /* Space from nav links */
        }

        .profile-button-top-nav:hover {
            background-color: var(--homifi-cyan);
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .profile-button-top-nav svg {
            color: var(--homifi-dark-blue); /* Icon color matches text */
            font-size: 1rem;
        }


        /* Hero Section Styles (from GuestDashboard) */
        .hero-section {
            position: relative;
            width: 100%;
            height: 60vh;
            min-height: 350px;
            overflow: hidden;
            margin-bottom: 3rem;
            display: flex;
            justify-content: center; /* Aligned content to the center */
            align-items: center;
            padding-left: 0; /* Removed padding-left */
            margin-top: 80px; /* To clear fixed header */
            box-sizing: border-box;
        }

        .hero-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: brightness(0.7);
        }

        .hero-content {
            position: relative;
            text-align: center; /* Aligned text to center */
            color: white;
            z-index: 10;
            padding: 20px;
            max-width: 800px;
        }

        .hero-section::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 5;
        }

        .hero-title {
            font-family: var(--font-heading);
            font-size: 4rem;
            font-weight: 700;
            color: white;
            margin-bottom: 0.75rem;
            line-height: 1.1;
        }

        .hero-tagline {
            font-size: 1.8rem;
            font-weight: 300;
            opacity: 0.9;
        }


        /* Right Sidebar */
        .profile-sidebar {
            position: fixed;
            top: 0;
            right: -280px;
            width: 260px;
            height: 100%;
            background-color: var(--homifi-darker-blue);
            color: white;
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
            color: white;
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
            color: white;
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
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
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
            margin: 0 auto; /* Center the content area */
            margin-top: 80px; /* Adjusted margin-top to clear fixed header */
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

        /* Error and Loading Messages */
        .error-message, .loading-message, .no-listings {
            text-align: center;
            color: var(--error-red);
            background-color: #f2dede;
            padding: 1rem;
            border-radius: 0.5rem;
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
            color: #555555;
            background-color: var(--bg-light-grey);
        }

        /* PG Listing Grid */
        .pg-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 2rem;
            padding-bottom: 4rem;
            width: 100%;
            max-width: 1200px;
            overflow-x: hidden;
        }

        /* PG Card Styles */
        .pg-card {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            display: flex;
            flex-direction: column;
            height: auto;
        }

        .pg-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .pg-card-image {
            width: 100%;
            height: 220px;
            object-fit: cover;
            border-bottom: 1px solid #eeeeee;
            border-radius: 12px 12px 0 0;
        }

        .pg-details-section {
            padding: 15px 20px 10px;
            border-bottom: 1px solid #eeeeee;
            margin-bottom: 10px;
        }

        .pg-name-in-card {
            font-size: 1.4em;
            font-weight: 700;
            color: var(--homifi-dark-blue);
            margin: 0 0 5px 0;
        }

        .pg-address-in-card {
            font-size: 0.95em;
            color: #555555;
            margin: 0;
        }

        /* Styling for inline available sharing options */
        .pg-sharing-options-summary {
            padding: 0 20px 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: flex-start;
            border-bottom: 1px solid #eeeeee;
            margin-bottom: 15px;
        }

        .pg-sharing-option-inline {
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: var(--bg-soft-blue);
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.9em;
            font-weight: 600;
            color: var(--homifi-dark-blue);
            white-space: nowrap;
        }

        .sharing-type {
            text-transform: capitalize;
        }

        .sharing-price {
            color: var(--success-green);
            font-weight: 700;
        }

        /* Show More/Less Button Container */
        .show-more-container {
            padding: 15px 20px;
            display: flex;
            flex-direction: row;
            gap: 10px;
            justify-content: center;
            background-color: white;
        }

        .show-more-button {
            background-color: var(--homifi-cyan);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 600;
            transition: background-color 0.3s ease, transform 0.2s ease;
            width: fit-content;
        }

        .show-more-button:hover {
            background-color: var(--homifi-teal);
            transform: translateY(-1px);
        }
        
        /* Wishlist button style for the card */
        .wishlist-button {
            color: var(--error-red);
            border-color: rgba(220, 53, 69, 0.5);
            background-color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
            font-size: 1rem;
        }

        .wishlist-button:hover {
            background-color: rgba(220, 53, 69, 0.1);
            border-color: var(--error-red);
            transform: translateY(-1px);
        }

        /* Custom Heart Button Styles */
        .button {
            background-color: transparent;
            border: none;
            border-radius: 0;
            width: auto;
            height: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: none;
            cursor: pointer;
            transition: transform 0.2s ease;
            padding: 0;
            margin: 0;
        }

        .button:hover {
            transform: scale(1.1);
        }

        .heart-stroke {
            fill: none;
            stroke: var(--homifi-dark-blue);
            stroke-width: 2px;
            opacity: 1;
            transform-origin: center center;
            transition: opacity 0.3s ease;
        }

        .button.active .heart-stroke {
            opacity: 0;
        }
          
        .heart-full {
            fill: var(--error-red);
            opacity: 0;
            transform-origin: 50% 50%;
            transition: opacity 0.3s ease;
        }

        .button.active .heart-full {
            opacity: 1;
        }
          
        .heart-lines {
            stroke: var(--homifi-teal);
            stroke-width: 2px;
            display: none;
        }

        .button:not(.active):hover .heart-stroke {
            animation: pulse 1s ease-out infinite;
        }

        .button.animate .heart-full {
            animation: heart 0.35s;
        }
        .button.animate .heart-lines {
            animation: lines 0.2s ease-out forwards;
            display: block;
        }
          
        @keyframes lines {
            0%   { 
                stroke-dasharray: 6;
                stroke-dashoffset: 16; 
            }
            100% { 
                stroke-dasharray: 13;
                stroke-dashoffset: 18; 
            }
        }

        @keyframes heart {
            0% {
                transform: scale(1);
                transform-origin: center center;
                animation-timing-function: ease-out;
            }
            10% {
                transform: scale(1.2);
                animation-timing-function: ease-in;
            }
            35% {
                transform: scale(1);
                animation-timing-function: ease-out;
            }
            75% {
                transform: scale(1.1);
                animation-timing-function: ease-in;
            }
            100% {
                transform: scale(1);
                animation-timing-function: ease-out;
            }
        }

        @keyframes pulse {
            0% {
                opacity: 1;
                transform-origin: center center;
                transform: scale(1);
            }
            50% {
                opacity: 0.6;
                transform: scale(1.15);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }


        /* Image Carousel Specific Styles */
        .image-carousel-container {
            position: relative;
            width: 100%;
            height: 220px;
            overflow: hidden;
            border-bottom: 1px solid #eeeeee;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
            background-color: #f0f0f0;
        }
        
        .pg-card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 12px 12px 0 0;
        }


        .carousel-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            padding: 8px;
            cursor: pointer;
            z-index: 5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s ease;
        }

        .carousel-arrow:hover {
            background-color: rgba(0, 0, 0, 0.8);
        }

        .left-arrow {
            left: 10px;
        }

        .right-arrow {
            right: 10px;
        }

        .carousel-dots {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 5px;
            z-index: 5;
        }

        .dot {
            width: 8px;
            height: 8px;
            background-color: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .dot.active {
            background-color: var(--homifi-teal);
            transform: scale(1.2);
        }


        /* Responsive adjustments */
        @media (max-width: 992px) {
            .navbar {
                height: 70px;
                padding: 0.6rem 1rem;
            }
            .logo-img {
                height: 35px;
            }
            .navbar-brand {
                font-size: 1.5rem;
            }
            .logo-tagline {
                font-size: 0.7rem;
            }
            .nav-links {
                gap: 1rem;
                margin-left: 1rem;
            }
            .nav-link {
                font-size: 0.9rem;
            }
            .profile-button-top-nav {
                padding: 0.5rem 1rem;
                font-size: 0.9rem;
            }
            .profile-button-top-nav svg {
                font-size: 0.9rem;
            }

            .dashboard-content-area {
                padding: 1.5rem;
                margin-top: 70px;
                gap: 1.5rem;
            }

            .pg-cards-grid {
                grid-template-columns: 1fr;
            }

            .hero-section {
                height: 40vh;
                min-height: 250px;
            }

            .hero-title {
                font-size: 2.8rem;
            }

            .hero-tagline {
                font-size: 1.3rem;
            }
        }

        @media (max-width: 768px) {
            .hero-title {
                font-size: 3rem;
            }
            .hero-tagline {
                font-size: 1.5rem;
            }
            .pg-card {
                border-radius: 6px;
            }
            .pg-card-image, .image-carousel-container {
                height: 160px;
            }
            .pg-details-section {
                padding: 1rem 1rem 0.5rem 1rem;
            }
            .pg-name-in-card {
                font-size: 1.2rem;
            }
            .pg-address-in-card {
                font-size: 0.85rem;
            }
            .pg-sharing-options-summary {
                padding: 0.5rem 1rem 1rem 1rem;
            }
            .pg-sharing-option-inline {
                font-size: 0.85em;
                padding: 6px 10px;
            }
            .show-more-container {
                padding: 1rem;
            }
            .show-more-button, .wishlist-button {
                padding: 0.5rem 1rem;
                font-size: 0.9em;
            }
        }

        @media (max-width: 480px) {
            .navbar {
                height: 60px;
                padding: 0.5rem 0.8rem;
            }
            .logo-img {
                height: 30px;
                margin-right: 5px;
            }
            .navbar-brand {
                font-size: 1.3rem;
                margin-left: 5px;
            }
            .logo-tagline {
                display: none; /* Hide tagline on very small screens */
            }
            .nav-links {
                display: none; /* Hide nav links on very small screens */
            }
            .profile-button-top-nav {
                padding: 0.4rem 0.8rem;
                font-size: 0.8rem;
            }
            .profile-button-top-nav svg {
                font-size: 0.8rem;
            }
            .hero-title {
                font-size: 2.2rem;
            }
            .hero-tagline {
                font-size: 1.1rem;
            }
            .dashboard-content-area {
                padding: 1rem;
                margin-top: 60px;
                gap: 1rem;
            }
            .pg-card {
                border-radius: 4px;
            }
            .pg-card-image, .image-carousel-container {
                height: 120px;
            }
            .pg-details-section {
                padding: 0.8rem 0.8rem 0.4rem 0.8rem;
            }
            .pg-name-in-card {
                font-size: 1.1rem;
            }
            .pg-address-in-card {
                font-size: 0.8rem;
            }
            .pg-sharing-options-summary {
                padding: 0.4rem 0.8rem 0.8rem 0.8rem;
            }
            .pg-sharing-option-inline {
                font-size: 0.8em;
                padding: 4px 8px;
            }
            .show-more-container {
                flex-direction: column;
                gap: 0.6rem;
                padding: 0.8rem;
            }
            .show-more-button, .wishlist-button {
                padding: 0.4rem 0.8rem;
                font-size: 0.8rem;
            }
        }

        /* MESSAGE BOX RELATED CLASS */
        .msgbox-area {
            font-size: inherit;
            max-height: 100%;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column-reverse; /* Stack from bottom up by default (mobile first) */
            align-items: center; /* Center horizontally */
            justify-content: flex-end; /* Align to bottom for column-reverse */
            pointer-events: none;
            z-index: 2000;
            width: 100%;
            height: 100%;
            padding: 15px; /* Add padding to prevent messages from touching edges */
            box-sizing: border-box;
        }

        @media (min-width: 768px) {
            .msgbox-area {
                flex-direction: column; /* Stack from top down for desktop */
                justify-content: flex-start; /* Align to top for column */
            }
        }

        .msgbox-box {
            font-size: inherit;
            color: #ffffff;
            background-color: rgba(0, 0, 0, 0.7);
            margin: 0.5rem 0; /* Margin between stacked messages */
            display: flex;
            flex-direction: column;
            position: relative;
            border-radius: 12px;
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(4px);
            transition: opacity 256ms ease-out, transform 256ms ease-out; /* Use ease-out for smoother pop */
            opacity: 0; /* Start hidden */
            transform: scale(0.8); /* Start smaller */
            pointer-events: auto;
            width: auto;
            max-width: 90%;
            min-width: 250px;
            text-align: center;
        }

        .msgbox-box.msgbox-box-show { /* Class added by JS to trigger pop-in */
            opacity: 1;
            transform: scale(1);
        }

        .msgbox-box.msgbox-box-hide {
            opacity: 0;
            transform: scale(0.8); /* Scale down when hiding */
        }

        /* Type-specific styles for MessageBox */
        .msgbox-box-success {
            background-color: var(--success-green);
        }

        .msgbox-box-error {
            background-color: var(--error-red);
        }

        .msgbox-box-info {
            background-color: var(--homifi-cyan);
        }

        @media (min-width: 481px) and (max-width: 767px) {
            .msgbox-area {
                /* No specific changes for tablet, will follow default centered behavior */
            }
        }

        /* Desktop media query for msgbox-area is now handled above for stacking direction */
      `}</style>
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="container"> {/* Added container for consistent width */}
          <div className="flex items-center">
            <Link to="/guest-dashboard" className="logo-link"> {/* Link to guest-dashboard as home */}
              <img src="https://firebasestorage.googleapis.com/v0/b/homifi-4d283.firebasestorage.app/o/logo.png?alt=media&token=c826ddbe-0d22-4061-8f5d-686f6e416a2f" alt="HomiFi Logo" className="logo-img" />
              {/* Removed HomiFi text and tagline as requested */}
            </Link>
          </div>
          <div className="nav-links"> {/* Renamed for clarity */}
            {/* Removed Home and Login links as per request */}
            {/* Removed About Us and Contact Us links as per request */}
          </div>
          <button onClick={handleProfileClick} className="profile-button-top-nav">
            <User size={20} />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
          <img src="https://firebasestorage.googleapis.com/v0/b/homifi-4d283.firebasestorage.app/o/hero-background.jpg?alt=media&token=0ad31552-f183-4283-b2bf-ffe1855bb666" alt="Welcome to HomiFi" className="hero-background" />
          <div className="hero-content">
              <h1 className="hero-title">Welcome to HomiFi</h1>
              <p className="hero-tagline">Find your perfect comfort zone.</p>
          </div>
      </div>

      {/* Right Sidebar for Profile and Navigation */}
      <div ref={sidebarRef} className={`profile-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close-button" onClick={() => setIsSidebarOpen(false)}>
          &times;
        </button>
        <div className="sidebar-content">
          <p className="sidebar-user-email">Welcome, {userEmail}</p>

          {/* Dashboard Button */}
          <button
            onClick={handleDashboardClick}
            className={`sidebar-button ${activeSection === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Browse PGs</span>
          </button>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistClick}
            className={`sidebar-button ${activeSection === 'wishlist' ? 'active' : ''}`}
          >
            <Heart size={20} />
            <span>Wishlist</span>
          </button>

          {/* Removed My Listings Button */}

          {/* Reset Password Button in Sidebar */}
          {auth?.currentUser?.email && ( // Only show if user has an email (not anonymous)
            <button
                onClick={handleResetPassword}
                className="sidebar-button"
                disabled={loading}
            >
                <Key size={20} />
                <span>Reset Password</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={() => { handleLogout(); setIsSidebarOpen(false); }}
            className="sidebar-button"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className={`dashboard-content-area ${isSidebarOpen ? 'shifted' : ''}`}>
        {/* The MessageBox will render its messages into #msgbox-area, which is appended to body */}
        {error && <p className="error-message">{error}</p>}
        {loading && <p className="loading-message">Fetching {activeSection === 'dashboard' ? 'available PGs' : 'your wishlisted PGs'}...</p>}

        {/* Conditional rendering of content based on activeSection */}
        {activeSection === 'dashboard' && (
          <React.Fragment>
            {!loading && displayedPgListings.length === 0 && (
              <p className="no-listings">No accepted PG listings available yet.</p>
            )}
            <div className="pg-cards-grid">
              {displayedPgListings.map((pg) => {
                return (
                  <div key={pg.id} className="pg-card">
                      {/* Use ImageCarousel for all PG cards now */}
                      <ImageCarousel photos={pg.photos} pgName={pg.pgName} />
                      <div className="pg-details-section">
                          <h3 className="pg-name-in-card">{pg.pgName}</h3>
                          <p className="pg-address-in-card">{pg.address}</p>
                      </div>

                      {/* Display initial sharing options summary (you can decide how many to show) */}
                      <div className="pg-sharing-options-summary">
                          {pg.sharingOptions &&
                              pg.sharingOptions
                                  .filter(option => option.status?.toLowerCase() === 'available')
                                  .slice(0, 3) // Still showing first 3 available options here
                                  .map((option, idx) => (
                                      <div key={idx} className="pg-sharing-option-inline">
                                          <span className="sharing-type">{option.type}</span>
                                          <span className="sharing-price">₹{option.price || 'N/A'}</span>
                                      </div>
                                  ))}
                      </div>

                      {/* "Show More" and "Wishlist" buttons */}
                      {pg.sharingOptions && pg.sharingOptions.length > 0 && (
                          <div className="show-more-container">
                              <button onClick={() => handleShowMoreClick(pg.id)} className="show-more-button">Show More</button>
                              <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleWishlist(pg.id); }}
                                  className="wishlist-button"
                                  title={wishlistedPgMeta.has(pg.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                              >
                                  <HeartIconSVG
                                    isActive={wishlistedPgMeta.has(pg.id)}
                                    isAnimating={animatingHearts[pg.id]}
                                  />
                                  {wishlistedPgMeta.has(pg.id) ? "Wishlisted" : "Wishlist"}
                              </button>
                          </div>
                      )}
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        )}

        {activeSection === 'wishlist' && (
          <React.Fragment>
            <h1 className="text-3xl font-bold text-[var(--homifi-teal)] mb-6">My Wishlist</h1>
            {!loading && displayedPgListings.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-600 text-lg">Your wishlist is empty.</p>
                <p className="text-500">Explore PGs and add them to your wishlist!</p>
              </div>
            ) : (
              <div className="pg-cards-grid">
                {displayedPgListings.map((pg) => {
                  return (
                  <div key={pg.id} className="pg-card">
                    <ImageCarousel photos={pg.photos} pgName={pg.pgName} />
                    <div className="pg-details-section">
                      <h4 className="pg-name-in-card">{pg.pgName}</h4>
                      <h6 className="pg-address-in-card">{pg.address}, {pg.state}</h6>
                      <div className="pg-sharing-options-summary">
                          {pg.sharingOptions && pg.sharingOptions
                              .map((option, idx) => {
                                return (
                                  <div key={idx} className="pg-sharing-option-inline">
                                      <span className="sharing-type">{option.type}</span>
                                      <span className="sharing-price">₹{option.price}</span> ({option.status})
                                  </div>
                                );
                              })}
                          {(!pg.sharingOptions || pg.sharingOptions.length === 0) && (
                              <span className="inline-block bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">No sharing options listed</span>
                          )}
                      </div>
                      <div className="show-more-container">
                          <button onClick={() => handleShowMoreClick(pg.id)} className="show-more-button">
                              <Info size={16} className="mr-1" /> Details
                          </button>
                          <button
                              onClick={(e) => { e.stopPropagation(); handleToggleWishlist(pg.id); }}
                              className="wishlist-button"
                              title={wishlistedPgMeta.has(pg.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                          >
                              <HeartIconSVG
                                isActive={wishlistedPgMeta.has(pg.id)}
                                isAnimating={animatingHearts[pg.id]}
                              />
                              {wishlistedPgMeta.has(pg.id) ? "Wishlisted" : "Wishlist"}
                          </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </React.Fragment>
        )}

        {/* Removed My Listings section */}
      </main>
    </div>
  );
};

export default UserDashboard;
