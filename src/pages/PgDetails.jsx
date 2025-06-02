// src/pages/PgDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './PgDetails.css'; // Corrected import path

// Your Firebase configuration (keep this consistent across components)
const firebaseConfig = {
    apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A",
    authDomain: "homifi-bac92.firebaseapp.com",
    projectId: "homifi-bac92",
    storageBucket: "homifi-bac92.appspot.com",
    messagingSenderId: "876737044340",
    appId: "1:876737044340:web:07d098db6f17f9c80bd621",
};

const PgDetails = () => {
    const { pgId } = useParams();
    const navigate = useNavigate();
    const [pgDetails, setPgDetails] = useState(null);
    const [ownerContact, setOwnerContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [db, setDb] = useState(null);
    const [showContact, setShowContact] = useState(false); // State to toggle contact info visibility

    // Initialize Firebase
    useEffect(() => {
        try {
            const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
            const dbInstance = getFirestore(app);
            setDb(dbInstance);
        } catch (err) {
            console.error("Failed to initialize Firebase in PG Details:", err);
            setError("Failed to load details. Please try again.");
        }
    }, []);

    // Fetch PG details when db and pgId are available
    useEffect(() => {
        if (db && pgId) {
            const fetchPgDetails = async () => {
                setLoading(true);
                setError('');
                try {
                    const docRef = doc(db, 'pg_listings', pgId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setPgDetails({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        setError("PG listing not found.");
                    }
                } catch (err) {
                    console.error("Error fetching PG details:", err);
                    setError("Failed to load PG details. Please try again.");
                } finally {
                    setLoading(false);
                }
            };
            fetchPgDetails();
        }
    }, [db, pgId]);

    // Function to handle "Book Now" click and fetch owner details
    const handleBookNow = async () => {
        if (!pgDetails || !pgDetails.ownerId || !db) {
            setError("Cannot fetch owner details. Missing PG or owner ID.");
            return;
        }

        try {
            // Fetch owner details from the 'pg_owners' collection using the ownerId
            const ownerDocRef = doc(db, 'pg_owners', pgDetails.ownerId);
            const ownerDocSnap = await getDoc(ownerDocRef);

            if (ownerDocSnap.exists()) {
                setOwnerContact(ownerDocSnap.data());
                setShowContact(true); // Set state to true to display contact info
            } else {
                setError("Owner details not found."); // This is the error you were seeing
            }
        } catch (err) {
            console.error("Error fetching owner details:", err);
            setError("Failed to retrieve owner contact. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="pg-details-container">
                <p className="loading-message">Loading PG details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pg-details-container">
                <p className="error-message">{error}</p>
                <button onClick={() => navigate('/guest-dashboard')} className="back-button">Back to Dashboard</button>
            </div>
        );
    }

    if (!pgDetails) {
        return (
            <div className="pg-details-container">
                <p className="no-details-message">No PG details available.</p>
                <button onClick={() => navigate('/guest-dashboard')} className="back-button">Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="pg-details-page">
            <button onClick={() => navigate('/guest-dashboard')} className="back-button-top">← Back to Listings</button>
            <h1 className="pg-details-title">{pgDetails.pgName}</h1>
            <p className="pg-details-location">📍 {pgDetails.address}</p>

            {pgDetails.photos && pgDetails.photos.length > 0 ? (
                <div className="pg-details-image-gallery">
                    {pgDetails.photos.map((photo, index) => (
                        <img key={index} src={photo.url} alt={`${pgDetails.pgName} - ${index + 1}`} className="pg-details-image" />
                    ))}
                </div>
            ) : (
                <div className="no-image-placeholder">No images available for this PG.</div>
            )}

            <div className="pg-details-section">
                <h2>About this PG</h2>
                <p>{pgDetails.description || 'No detailed description available.'}</p>
            </div>

            <div className="pg-details-section">
                <h2>Sharing Options</h2>
                {pgDetails.sharingOptions && pgDetails.sharingOptions.length > 0 ? (
                    <div className="sharing-options-grid">
                        {pgDetails.sharingOptions.map((option, index) => (
                            <div key={index} className="sharing-option-card">
                                <h3>{option.type}</h3>
                                <p>Price: ₹{option.price || 'N/A'}</p>
                                <p>Status: <span className={`pg-tag ${option.status?.toLowerCase()}`}>{option.status || 'N/A'}</span></p>
                                {option.description && <p className="option-description">{option.description}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No sharing options listed for this PG.</p>
                )}
            </div>

            <div className="pg-details-section">
                <h2>Amenities</h2>
                {pgDetails.amenities && pgDetails.amenities.length > 0 ? (
                    <ul className="amenities-list">
                        {pgDetails.amenities.map((amenity, index) => (
                            <li key={index}>{amenity}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No amenities listed.</p>
                )}
            </div>

            <button onClick={handleBookNow} className="book-now-button">Book Now</button>

            {/* This section is conditionally rendered when showContact is true and ownerContact is available */}
            {showContact && ownerContact && (
                <div className="owner-contact-details">
                    <h3>Owner Contact Information:</h3>
                    <p><strong>Name:</strong> {ownerContact.name || 'N/A'}</p>
                    <p><strong>Phone:</strong> <a href={`tel:${ownerContact.phone}`}>{ownerContact.phone || 'N/A'}</a></p>
                    <p><strong>Email:</strong> <a href={`mailto:${ownerContact.email}`}>{ownerContact.email || 'N/A'}</a></p>
                    {/* Add more owner details if available in your 'pg_owners' collection */}
                </div>
            )}

            {/* Display an error if showContact is true but ownerContact is not found */}
            {showContact && !ownerContact && (
                <p className="error-message">Owner contact details could not be retrieved.</p>
            )}
        </div>
    );
};

export default PgDetails;