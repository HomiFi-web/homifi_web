// src/pages/GuestDashboard.js (assuming it's in your pages directory)
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './GuestDashboard.css'; // Adjust path if necessary based on your file structure

// Import hero background image
import heroImage from '../assets/hero-background.jpg'; // Adjust path if necessary

// Your Firebase configuration (keep this consistent across components)
const firebaseConfig = {
    apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A",
    authDomain: "homifi-bac92.firebaseapp.com",
    projectId: "homifi-bac92",
    storageBucket: "homifi-bac92.appspot.com",
    messagingSenderId: "876737044340",
    appId: "1:876737044340:web:07d098db6f17f9c80bd621",
};

const GuestDashboard = () => {
    const [pgListings, setPgListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [db, setDb] = useState(null);
    const navigate = useNavigate(); // Initialize useNavigate hook

    // Initialize Firebase
    useEffect(() => {
        try {
            const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
            const dbInstance = getFirestore(app);
            setDb(dbInstance);
        } catch (err) {
            console.error("Failed to initialize Firebase in Guest Dashboard:", err);
            setError("Failed to load listings. Please try again.");
        }
    }, []);

    // Fetch PG listings (only 'accepted' ones)
    useEffect(() => {
        if (db) {
            setLoading(true);
            setError('');

            const q = query(
                collection(db, 'pg_listings'),
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
    }, [db]);

    // This function will now navigate to the PgDetails page
    const handleShowMoreClick = (pgId) => {
        navigate(`/pg-details/${pgId}`); // Navigate to the details page with the PG ID
    };

    if (loading) {
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

    // You can remove the initialOptionsToShow and any logic that was for expanding on the same page.
    // As "Show More" now navigates.
    // const initialOptionsToShow = 3;

    return (
        <div className="guest-dashboard">
            <div className="hero-section">
                <img src={heroImage} alt="Welcome to HomiFi" className="hero-background" />
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

                                {/* "Show More" button to navigate to a new page */}
                                {pg.sharingOptions && pg.sharingOptions.length > 0 && ( // Show button if there are any options
                                    <div className="show-more-container">
                                        <button onClick={() => handleShowMoreClick(pg.id)} className="show-more-button">Show More</button>
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