// src/pages/PgDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './PgDetails.css'; // IMPORTANT: Please ensure PgDetails.css is in the same 'pages' directory as this file and named exactly 'PgDetails.css'

// Firebase configuration for homifi-4d283 project
const firebaseConfig = {
    apiKey: "AIzaSyCENbG6LtD_dVaNoqyoJuLmxiyTQNi6e0E", // API key for homifi-4d283
    authDomain: "homifi-4d283.firebaseapp.com",
    projectId: "homifi-4d283",
    storageBucket: "homifi-4d283.appspot.com", // Storage bucket for homifi-4d283
    messagingSenderId: "434013049134", // Messaging sender ID for homifi-4d283
    appId: "1:434013049134:web:YOUR_ACTUAL_WEB_APP_ID", // IMPORTANT: REPLACE with your specific web app ID from Firebase console for homifi-4d283
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
    const [showModal, setShowModal] = useState(false); // State for modal visibility

    // Utility function to format phone number for display, handling potential duplication
    const formatPhoneNumberForDisplay = (phone) => {
        if (!phone) return 'N/A';
        let cleanedPhone = phone.replace(/[^+\d]/g, '');

        // Define common country code patterns to check for
        const countryCodePatterns = [
            '\\+91', '\\+1', '\\+44', '\\+61', '\\+49', '\\+33', '\\+81', '\\+86', '\\+55', '\\+27', '\\+82'
        ];
        // Create a regex that captures the country code and the rest of the number
        const regex = new RegExp(`^(${countryCodePatterns.join('|')})(\\d+)$`);
        const match = cleanedPhone.match(regex);

        if (match) {
            const countryCodePart = match[1];
            const numberPart = match[2];

            // Heuristic to detect and fix duplication: If the number part is twice its typical length
            // and the first half is identical to the second half, then assume duplication.
            // This assumes a typical mobile number is 10-12 digits.
            const typicalNumberLengthThreshold = 10; // Adjust as needed for your primary regions
            if (numberPart.length > typicalNumberLengthThreshold && numberPart.length % 2 === 0) {
                const firstHalf = numberPart.substring(0, numberPart.length / 2);
                const secondHalf = numberPart.substring(numberPart.length / 2);
                if (firstHalf === secondHalf) {
                    return countryCodePart + firstHalf;
                }
            }
        }
        // If no duplication detected or pattern doesn't match, return the cleaned phone as is.
        return cleanedPhone;
    };


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

    // Function to handle "Book Now" click
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
                setShowModal(true); // Show the booking confirmation modal
            } else {
                setError("Owner details not found.");
            }
        } catch (err) {
            console.error("Error fetching owner details:", err);
            setError("Failed to retrieve owner contact. Please try again.");
        }
    };

    // Function to close the modal and navigate back
    const handleCloseModal = () => {
        setShowModal(false);
        navigate(-1); // Go back to the previous page
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

    // Determine amenities and services from pgDetails.facilities
    const allFacilities = pgDetails.facilities || [];
    // Define comprehensive lists for amenities and services to ensure correct categorization
    // These lists should ideally be consistent with what's used in the PG owner dashboard
    const predefinedAmenitiesList = [
      'Attached Balcony', 'Air Conditioning', 'Attached Washroom', 'Storage Shelf',
      'Spacious Cupboard', 'Desert Cooler', 'Spacious Refrigerator', 'Washing Machine',
      'Flat Screen Television', 'Biometric Enabled Entry',
    ];
    const predefinedServicesList = [
      'Hot and Delicious Meals', 'High-Speed WIFI', 'Power Backup', 'Laundry Service',
      'Workout Zone', 'Professional Housekeeping',
      '24x7 Security Surveillance', 'Hot Water Supply', 'Water Purifier', 'In-House Cafeteria',
    ];

    // Filter facilities into amenities and services based on the predefined lists
    const currentAmenities = allFacilities.filter(facility => predefinedAmenitiesList.includes(facility));
    const currentServices = allFacilities.filter(facility => predefinedServicesList.includes(facility));


    return (
        <div className="pg-details-page">
            <button onClick={() => navigate('/guest-dashboard')} className="back-button-top">← Back to Listings</button>
            <h1 className="pg-details-title">{pgDetails.pgName}</h1>
            {/* Combined location details into one line */}
            <p className="pg-details-location">
                📍 {pgDetails.address}
                {pgDetails.state && `, ${pgDetails.state}`}
                {pgDetails.country && `, ${pgDetails.country}`}
                {pgDetails.pincode && ` - ${pgDetails.pincode}`}
                {pgDetails.locationLink && (
                    <a href={pgDetails.locationLink} target="_blank" rel="noopener noreferrer" className="location-link">
                        &nbsp;(View on Map)
                    </a>
                )}
            </p>

            {pgDetails.photos && pgDetails.photos.length > 0 ? (
                <div className="pg-details-image-gallery">
                    {pgDetails.photos.map((photo, index) => (
                        <img key={index} src={photo.url} alt={`${pgDetails.pgName} - ${index + 1}`} className="pg-details-image" />
                    ))}
                </div>
            ) : (
                <div className="no-image-placeholder">No images available for this PG.</div>
            )}

            {/* Removed "About this PG" section as requested */}

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

            {/* Displaying Amenities and Services uniquely */}
            <div className="pg-details-section">
                <h2>Amenities</h2>
                {currentAmenities.length > 0 ? (
                    <ul className="amenities-list">
                        {currentAmenities.map((amenity, index) => (
                            <li key={index}>{amenity}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No amenities listed for this PG.</p>
                )}
            </div>

            <div className="pg-details-section">
                <h2>Services</h2>
                {currentServices.length > 0 ? (
                    <ul className="amenities-list"> {/* Reusing amenities-list styling for consistency */}
                        {currentServices.map((service, index) => (
                            <li key={index}>{service}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No services listed for this PG.</p>
                )}
            </div>


            <button onClick={handleBookNow} className="book-now-button">Book Now</button>

            {/* This section is conditionally rendered when showContact is true and ownerContact is available */}
            {showContact && ownerContact && (
                <div className="owner-contact-details">
                    <h3>Owner Contact Information:</h3>
                    <p><strong>Name:</strong> {ownerContact.name || 'N/A'}</p>
                    {/* Apply the formatting function to the phone number */}
                    <p><strong>Phone:</strong> <a href={`tel:${ownerContact.phone}`}>{formatPhoneNumberForDisplay(ownerContact.phone)}</a></p>
                    <p><strong>Email:</strong> <a href={`mailto:${ownerContact.email}`}>{ownerContact.email || 'N/A'}</a></p>
                    {/* Add more owner details if available in your 'pg_owners' collection */}
                </div>
            )}

            {/* Display an error if showContact is true but ownerContact is not found */}
            {showContact && !ownerContact && (
                <p className="error-message">Owner contact details could not be retrieved.</p>
            )}

            {/* Custom Modal for Booking Confirmation */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <span className="close-button" onClick={handleCloseModal}>&times;</span>
                        <h2>Booking Request Sent!</h2>
                        <p>Thank you for your interest in {pgDetails.pgName}.</p>
                        {/* Modified message: emphasized user action for contact */}
                        <p>Please use the contact information below to reach out to the owner directly:</p>
                        <p><strong>Name:</strong> {ownerContact?.name || 'N/A'}</p>
                        {/* Apply the formatting function here as well */}
                        <p><strong>Phone:</strong> <a href={`tel:${ownerContact?.phone}`}>{formatPhoneNumberForDisplay(ownerContact?.phone)}</a></p>
                        <p><strong>Email:</strong> <a href={`mailto:${ownerContact?.email}`}>{ownerContact?.email || 'N/A'}</a></p>
                        <button onClick={handleCloseModal} className="modal-ok-button">
                            {/* SVG for a left arrow icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"/>
                            </svg>
                            Go Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PgDetails;
