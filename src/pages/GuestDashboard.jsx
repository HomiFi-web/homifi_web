// src/pages/GuestDashboard.js (assuming it's in your pages directory)
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase Auth functions
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Your Firebase configuration (keep this consistent across components)
const firebaseConfig = {
    apiKey: "AIzaSyCENbG6LtD_dVaNoqyoJuLmxiyTQNi6e0E", // Updated API Key
    authDomain: "homifi-4d283.firebaseapp.com", // Updated Auth Domain
    projectId: "homifi-4d283", // Updated Project ID
    storageBucket: "homifi-4d283.appspot.com", // Updated Storage Bucket
    messagingSenderId: "434013049134", // Updated Messaging Sender ID (Project Number)
    appId: "1:434013049134:web:07d098db6f17f9c80bd621", // Updated App ID (using project number)
};

const GuestDashboard = () => {
    const [pgListings, setPgListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null); // Firebase Auth instance
    const [isLoggedIn, setIsLoggedIn] = useState(false); // User login status
    const [authReady, setAuthReady] = useState(false); // New state to track if auth state is ready
    const navigate = useNavigate(); // Initialize useNavigate hook

    // Initialize Firebase and Auth
    useEffect(() => {
        try {
            const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
            const dbInstance = getFirestore(app);
            const authInstance = getAuth(app); // Get Auth instance
            setDb(dbInstance);
            setAuth(authInstance); // Set Auth instance
        } catch (err) {
            console.error("Failed to initialize Firebase in Guest Dashboard:", err);
            setError("Failed to load listings. Please try again.");
        }
    }, []);

    // Listen for Auth state changes
    useEffect(() => {
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                setIsLoggedIn(!!user); // Set isLoggedIn based on user presence
                setAuthReady(true); // Auth state has been checked
                console.log("Auth state changed. User logged in:", !!user, "Auth Ready:", true);
            });
            return () => unsubscribe(); // Cleanup subscription
        }
    }, [auth]);

    // Fetch PG listings (only 'accepted' ones)
    useEffect(() => {
        if (db && authReady) { // Ensure auth state is ready before fetching
            setLoading(true);
            setError('');

            // Use the projectId from firebaseConfig as appId for consistency with artifacts path
            const appId = firebaseConfig.projectId; 
            const q = query(
                collection(db, `artifacts/${appId}/public/data/pg_listings`),
                where('status', '==', 'accepted')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const listings = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPgListings(listings);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching PG listings for guest:", err);
                setError("Failed to load PG listings. Please try again.");
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [db, authReady]); // Add authReady to dependency array

    // This function will now always navigate to the login page when "Show More" is clicked
    const handleShowMoreClick = (pgId) => {
        console.log("Show More clicked. Routing to /login");
        navigate('/login'); // Always navigate to login page
    };

    if (loading || !authReady) { // Show loading until both PG details and auth status are ready
        return (
            <div className="guest-dashboard-container">
                <p className="loading-message">Loading PG listings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="guest-dashboard-container">
                <p className="error-message">{error}</p>
            </div>
        );
    }

    return (
        <div className="guest-dashboard">
            <style>{`
                /* General Styling & Color Palette (consistent with other dashboards) */
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

                    --text-dark: #333333;
                    --text-medium: #555555;
                    --text-light: #777777;
                    --border-light: #e0e0e0;
                    --border-subtle: #eeeeee;
                    --shadow-light: rgba(0, 0, 0, 0.08);

                    /* Fonts (assuming you have these imported in your index.css or similar) */
                    --font-primary: 'Inter', sans-serif;
                    --font-heading: 'Poppins', sans-serif; /* Example for headings */
                }

                body {
                    font-family: var(--font-primary);
                    margin: 0;
                    padding: 0;
                    background-color: var(--bg-light-grey);
                    color: var(--text-dark);
                }

                /* Overall Dashboard Container */
                .guest-dashboard {
                background-color: var(--bg-light-grey);
                font-family: var(--font-primary);
                min-height: 100vh;
                color: var(--text-dark);
                }

                /* Page Content Container - To center content */
                .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
                }

                /* Hero Section Styles (Image with Overlay) */
                .hero-section {
                position: relative;
                width: 100%;
                height: 60vh; /* Changed from 80vh to 60vh for better balance */
                min-height: 350px;
                overflow: hidden;
                margin-bottom: 3rem;
                display: flex;
                justify-content: center;
                align-items: center;
                }

                .hero-background {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: brightness(0.7); /* For image brightness */
                }

                .hero-content {
                position: relative;
                text-align: center;
                color: var(--bg-white);
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
                background-color: rgba(0, 0, 0, 0.5); /* Black transparent overlay (0.5 opacity) */
                z-index: 5;
                }

                .hero-title {
                font-family: var(--font-heading);
                font-size: 4rem;
                font-weight: 700;
                color: var(--bg-white);
                margin-bottom: 0.75rem;
                line-height: 1.1;
                }

                .hero-tagline {
                font-size: 1.8rem;
                font-weight: 300;
                opacity: 0.9;
                }

                /* General button styles for the dashboard */
                .filter-button,
                .wishlist-button {
                background-color: var(--bg-white);
                border: 1px solid var(--border-light);
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                padding: 0.75rem 1.5rem;
                color: var(--text-medium);
                transition: all 0.3s ease;
                cursor: pointer;
                font-weight: 500;
                font-size: 1rem;
                display: flex; /* Use flex for icon and text alignment */
                align-items: center;
                gap: 8px; /* Space between icon and text */
                }

                .filter-button:hover {
                background-color: var(--bg-light-grey);
                border-color: var(--border-subtle);
                color: var(--homifi-dark-blue);
                transform: translateY(-2px);
                }

                .wishlist-button {
                    color: var(--error-red);
                    border-color: rgba(220, 53, 69, 0.5);
                    background-color: var(--bg-white); /* Ensure background is white */
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

                /* Grid for property listings */
                .grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* Adjusted minmax slightly */
                gap: 2rem;
                padding-bottom: 4rem;
                }

                /* PG Card Styles */
                .pg-card {
                    background-color: var(--bg-white);
                    border-radius: 12px;
                    box-shadow: 0 4px 15px var(--shadow-light);
                    overflow: hidden;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    height: auto; /* Allow height to adjust based on content */
                }

                .pg-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                }

                .pg-card-image {
                    width: 100%;
                    height: 220px; /* Slightly taller images */
                    object-fit: cover;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .pg-details-section {
                    padding: 15px 20px 10px; /* Padding for name and address */
                    border-bottom: 1px solid var(--border-subtle);
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
                    color: var(--text-medium);
                    margin: 0;
                }

                /* Styling for inline available sharing options */
                .pg-sharing-options-summary {
                    padding: 0 20px 10px; /* Padding for summary section */
                    display: flex;
                    flex-wrap: wrap; /* Allow items to wrap to next line */
                    gap: 15px; /* Space between inline options */
                    justify-content: flex-start; /* Align items to the start */
                    border-bottom: 1px solid var(--border-subtle);
                    margin-bottom: 15px;
                }

                .pg-sharing-option-inline {
                    display: flex;
                    align-items: center;
                    gap: 8px; /* Space between type and price */
                    background-color: var(--bg-soft-blue); /* Light blue background for available options */
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 0.9em;
                    font-weight: 600;
                    color: var(--homifi-dark-blue);
                    white-space: nowrap; /* Keep type and price on one line */
                }

                .sharing-type {
                    text-transform: capitalize; /* Capitalize the first letter */
                }

                .sharing-price {
                    color: var(--success-green); /* Price in green for available */
                    font-weight: 700;
                }


                /* Show More/Less Button Container */
                .show-more-container {
                    padding: 15px 20px;
                    display: flex;
                    flex-direction: row; /* Changed to row for horizontal alignment */
                    gap: 10px; /* Gap between buttons */
                    justify-content: center; /* Center the buttons horizontally */
                    background-color: var(--bg-white); /* Ensure background is white for clarity */
                }

                .show-more-button {
                    background-color: var(--homifi-cyan); /* Cyan button */
                    color: var(--bg-white);
                    border: none;
                    border-radius: 8px;
                    padding: 10px 15px;
                    cursor: pointer;
                    font-size: 1em;
                    font-weight: 600;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                    width: fit-content; /* Button width adjusts to content */
                    /* Removed align-self: center as justify-content handles centering */
                }

                .show-more-button:hover {
                    background-color: var(--homifi-teal);
                    transform: translateY(-1px);
                }

                /* Styling for ALL sharing options when "Show More" is active */
                .pg-sharing-option-full {
                    background-color: var(--bg-light-grey);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    padding: 12px 15px;
                    margin-bottom: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }

                .sharing-type-full {
                    font-size: 1.1em;
                    font-weight: 600;
                    color: var(--homifi-dark-blue);
                }

                .pg-description-full {
                    font-size: 0.9em;
                    color: var(--text-medium);
                    margin: 0;
                }

                .pg-price-full {
                    font-size: 1em;
                    font-weight: 700;
                    color: var(--homifi-dark-blue);
                    margin-top: 5px;
                }

                .pg-tag {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 5px;
                    font-size: 0.75em;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: white;
                    white-space: nowrap;
                }

                .pg-tag.available {
                    background-color: var(--success-green);
                }

                .pg-tag.limited {
                    background-color: var(--warning-orange);
                }

                .pg-tag.full {
                    background-color: var(--error-red);
                }

                /* Messages */
                .loading-message, .error-message, .no-listings-found {
                    text-align: center;
                    font-size: 1.1em;
                    padding: 20px;
                    color: var(--text-dark);
                }

                .error-message {
                    color: var(--error-red);
                    font-weight: bold;
                }

                /* Login Modal Styles - REMOVED */
                /* .login-modal-overlay { ... } */
                /* .login-modal-content { ... } */
                /* @keyframes fadeInScale { ... } */
                /* .login-modal-content h2 { ... } */
                /* .login-modal-content p { ... } */
                /* .modal-actions { ... } */
                /* .modal-login-button, .modal-close-button { ... } */
                /* .modal-login-button { ... } */
                /* .modal-login-button:hover { ... } */
                /* .modal-close-button { ... } */
                /* .modal-close-button:hover { ... } */


                /* Responsive adjustments */
                @media (max-width: 768px) {
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

                    .grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 480px) {
                    .hero-title {
                        font-size: 2.2rem;
                    }

                    .hero-tagline {
                        font-size: 1.1rem;
                    }

                    .filter-button, .wishlist-button {
                        padding: 0.6rem 1rem;
                        font-size: 0.9em;
                    }
                }
            `}</style>
            <div className="hero-section">
                {/* Corrected the image source to use the Firebase Storage URL */}
                <img src="https://firebasestorage.googleapis.com/v0/b/homifi-4d283.firebasestorage.app/o/hero-background.jpg?alt=media&token=0ad31552-f183-4283-b2bf-ffe1855bb666" alt="Welcome to HomiFi" className="hero-background" />
                <div className="hero-content">
                    <h1 className="hero-title">Welcome to HomiFi</h1>
                    <p className="hero-tagline">Find your perfect comfort zone.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pgListings.length === 0 ? (
                        <p className="no-listings-found">No accepted PG listings found at this location yet.</p>
                    ) : (
                        pgListings.map((pg) => (
                            <div key={pg.id} className="pg-card">
                                {pg.photos && pg.photos.length > 0 && pg.photos[0].url ? (
                                    <img src={pg.photos[0].url} alt={pg.pgName || 'PG Photo'} className="pg-card-image" />
                                ) : (
                                    <img src="https://placehold.co/300x200/E0E0E0/333333?text=No+Image" alt="No Image Available" className="pg-card-image" />
                                )}
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
                                {pg.sharingOptions && pg.sharingOptions.length > 0 && ( // Show buttons if there are any options
                                    <div className="show-more-container">
                                        <button onClick={() => handleShowMoreClick(pg.id)} className="show-more-button">Show More</button>
                                        <button onClick={() => navigate('/login')} className="wishlist-button"> {/* Directly navigate to login */}
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"> {/* Adjusted SVG size */}
                                                <path d="m11.645 20.917-7.393-7.393A4.5 4.5 0 0 1 3 10.148V9.25c0-5.404 4.396-9.8 9.8-9.8s9.8 4.396 9.8 9.8v.898c0 1.258-.46 2.44-1.288 3.334l-7.393 7.393a.75.75 0 0 1-1.06 0Z" />
                                            </svg>
                                            Wishlist
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestDashboard;
