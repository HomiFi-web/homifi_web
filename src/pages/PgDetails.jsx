// src/pages/PgDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase Auth functions
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
    const [auth, setAuth] = useState(null); // Firebase Auth instance
    const [isLoggedIn, setIsLoggedIn] = useState(false); // User login status
    const [authReady, setAuthReady] = useState(false); // New state to track if auth state is ready
    const [showContact, setShowContact] = useState(false); // State to toggle contact info visibility
    const [showModal, setShowModal] = useState(false); // State for booking confirmation modal visibility
    const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false); // State for login required modal visibility
    const [mainGalleryImageIndex, setMainGalleryImageIndex] = useState(0); // State for current image index in main gallery
    const [zoomedImage, setZoomedImage] = useState(null); // State for zoomed image { url, caption, index }

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
                const secondHalf = numberPart.length / 2;
                if (firstHalf === secondHalf) {
                    return countryCodePart + firstHalf;
                }
            }
        }
        // If no duplication detected or pattern doesn't match, return the cleaned phone as is.
        return cleanedPhone;
    };


    // Initialize Firebase and Auth
    useEffect(() => {
        try {
            const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
            const dbInstance = getFirestore(app);
            const authInstance = getAuth(app); // Get Auth instance
            setDb(dbInstance);
            setAuth(authInstance); // Set Auth instance
        } catch (err) {
            console.error("Failed to initialize Firebase in PG Details:", err);
            setError("Failed to load details. Please try again.");
        }
    }, []);

    // Listen for Auth state changes
    useEffect(() => {
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                setIsLoggedIn(!!user); // Set isLoggedIn based on user presence
                setAuthReady(true); // Auth state has been checked
            });
            return () => unsubscribe(); // Cleanup subscription
        }
    }, [auth]);

    // Fetch PG details when db and pgId are available
    useEffect(() => {
        if (db && pgId) {
            const fetchPgDetails = async () => {
                setLoading(true);
                setError('');
                try {
                    // Path for pg_listings - remains consistent with GuestDashboard
                    const appId = firebaseConfig.projectId; // Using projectId as appId for consistency
                    const docRef = doc(db, `artifacts/${appId}/public/data/pg_listings`, pgId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setPgDetails({ id: docSnap.id, ...docSnap.data() });
                        setMainGalleryImageIndex(0); // Reset image index when new PG details are loaded
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
        if (!authReady) { // Prevent action if auth state is not yet determined
            console.log("Authentication state not ready, please wait.");
            return;
        }

        if (!isLoggedIn) { // Check if user is logged in
            setShowLoginRequiredModal(true); // Show login required modal
            return; // Stop execution if not logged in
        }

        if (!pgDetails || !pgDetails.ownerId || !db) {
            setError("Cannot fetch owner details. Missing PG or owner ID.");
            return;
        }

        try {
            // Fetch owner details from the 'pg_owners' collection using the ownerId
            // Changed this line: Assuming 'pg_owners' is a top-level collection.
            // If it's nested under 'artifacts/{appId}/public/data/', revert to previous.
            const ownerDocRef = doc(db, 'pg_owners', pgDetails.ownerId); // Changed path
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

    // Function to close the booking confirmation modal and navigate back
    const handleCloseModal = () => {
        setShowModal(false);
        navigate(-1); // Go back to the previous page
    };

    // Function to close the login required modal and navigate to user login
    const handleLoginRequiredModalLogin = () => {
        setShowLoginRequiredModal(false);
        navigate('/user-login'); // Navigate to the user login page
    };

    // Functions for image navigation in main gallery
    const handleMainGalleryPrev = () => {
        setMainGalleryImageIndex((prevIndex) =>
            prevIndex === 0 ? (pgDetails.photos ? pgDetails.photos.length - 1 : 0) : prevIndex - 1
        );
    };

    const handleMainGalleryNext = () => {
        setMainGalleryImageIndex((prevIndex) =>
            pgDetails.photos && prevIndex === pgDetails.photos.length - 1 ? 0 : prevIndex + 1
        );
    };

    // Function to handle image click for zoom
    const handleImageClick = (index) => {
        if (pgDetails.photos && pgDetails.photos.length > 0) {
            setZoomedImage({
                url: pgDetails.photos[index].url,
                caption: pgDetails.photos[index].caption || `Image ${index + 1}`, // Use a default caption
                index: index
            });
        }
    };

    // Functions for navigation within the zoomed image modal
    const handleZoomedPrev = () => {
        const newIndex = zoomedImage.index === 0 ? pgDetails.photos.length - 1 : zoomedImage.index - 1;
        setZoomedImage({
            url: pgDetails.photos[newIndex].url,
            caption: pgDetails.photos[newIndex].caption || `Image ${newIndex + 1}`,
            index: newIndex
        });
    };

    const handleZoomedNext = () => {
        const newIndex = zoomedImage.index === pgDetails.photos.length - 1 ? 0 : zoomedImage.index + 1;
        setZoomedImage({
            url: pgDetails.photos[newIndex].url,
            caption: pgDetails.photos[newIndex].caption || `Image ${newIndex + 1}`,
            index: newIndex
        });
    };

    if (loading || !authReady) { // Show loading until both PG details and auth status are ready
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
                <button onClick={() => navigate('/user-dashboard')} className="back-button">Back to Dashboard</button>
            </div>
        );
    }

    if (!pgDetails) {
        return (
            <div className="pg-details-container">
                <p className="no-details-message">No PG details available.</p>
                <button onClick={() => navigate('/user-dashboard')} className="back-button">Back to Dashboard</button>
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

                .pg-details-page {
                    max-width: 900px;
                    margin: 2rem auto;
                    padding: 20px;
                    background-color: var(--bg-white);
                    border-radius: 12px;
                    box-shadow: 0 4px 20px var(--shadow-light);
                }

                .back-button-top {
                    background-color: var(--border-light);
                    color: var(--text-dark);
                    border: none;
                    border-radius: 8px;
                    padding: 10px 15px;
                    cursor: pointer;
                    font-size: 0.95em;
                    font-weight: 500;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                    margin-bottom: 20px;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }

                .back-button-top:hover {
                    background-color: var(--border-subtle);
                    transform: translateY(-1px);
                }

                .pg-details-title {
                    font-family: var(--font-heading);
                    font-size: 2.5em;
                    color: var(--homifi-dark-blue);
                    margin-bottom: 10px;
                    text-align: center;
                }

                .pg-details-location {
                    font-size: 1.1em;
                    color: var(--text-medium);
                    text-align: center;
                    margin-bottom: 20px;
                }

                .location-link {
                    color: var(--homifi-cyan);
                    text-decoration: none;
                    font-weight: 500;
                }

                .location-link:hover {
                    text-decoration: underline;
                }

                /* Image Gallery Container (for single image display) */
                .pg-details-image-gallery {
                    position: relative; /* Needed for absolute positioning of arrows */
                    width: 100%;
                    /* max-width: 700px; /* Removed for full width */
                    height: 400px; /* Fixed height for consistency */
                    /* margin: 0 auto 30px auto; /* Removed for full width */
                    overflow: hidden;
                    /* border-radius: 12px; /* Removed for full width */
                    /* box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); /* Removed for full width */
                    display: flex; /* Use flex to center the image */
                    justify-content: center;
                    align-items: center;
                    background-color: var(--bg-light-grey); /* Fallback background */
                    padding: 0; /* Remove padding here */
                }

                .pg-details-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain; /* Use contain to show full image, cover if you prefer cropping */
                    /* border-radius: 8px; /* Removed for full width */
                    transition: opacity 0.5s ease-in-out; /* Smooth transition for image change */
                    cursor: pointer; /* Indicate clickability */
                }

                .no-image-placeholder {
                    text-align: center;
                    padding: 50px;
                    background-color: var(--bg-soft-blue);
                    color: var(--text-medium);
                    border-radius: 8px;
                    margin-bottom: 30px;
                }

                /* Image Navigation Arrows (for main gallery) */
                .image-nav-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background-color: rgba(0, 0, 0, 0.5);
                    color: white;
                    border: none;
                    padding: 10px;
                    cursor: pointer;
                    font-size: 2em;
                    border-radius: 50%;
                    width: 50px; /* Fixed width for circular button */
                    height: 50px; /* Fixed height for circular button */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: background-color 0.3s ease;
                    z-index: 10; /* Ensure arrows are above the image */
                }

                .image-nav-arrow:hover {
                    background-color: rgba(0, 0, 0, 0.7);
                }

                .image-nav-arrow.left {
                    left: 0; /* Position directly on the left edge */
                }

                .image-nav-arrow.right {
                    right: 0; /* Position directly on the right edge */
                }

                .image-nav-arrow svg {
                    fill: currentColor;
                    width: 30px; /* Adjust SVG size within the button */
                    height: 30px;
                }


                .pg-details-section {
                    background-color: var(--bg-light-grey);
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 25px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                }

                .pg-details-section h2 {
                    font-family: var(--font-heading);
                    font-size: 1.8em;
                    color: var(--homifi-dark-blue);
                    margin-top: 0;
                    margin-bottom: 15px;
                    border-bottom: 2px solid var(--homifi-cyan);
                    padding-bottom: 10px;
                }

                .pg-details-section p {
                    font-size: 1em;
                    line-height: 1.6;
                    color: var(--text-dark);
                }

                .sharing-options-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }

                .sharing-option-card {
                    background-color: var(--bg-white);
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
                    border: 1px solid var(--border-subtle);
                }

                .sharing-option-card h3 {
                    font-size: 1.2em;
                    color: var(--homifi-teal);
                    margin-top: 0;
                    margin-bottom: 10px;
                }

                .sharing-option-card p {
                    margin-bottom: 5px;
                }

                .option-description {
                    font-size: 0.9em;
                    color: var(--text-light);
                    margin-top: 10px;
                }

                .pg-tag {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 5px;
                    font-size: 0.8em;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: white;
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

                .amenities-list {
                    list-style: none;
                    padding: 0;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 10px;
                }

                .amenities-list li {
                    background-color: var(--bg-white);
                    padding: 10px 15px;
                    border-radius: 8px;
                    border: 1px solid var(--border-subtle);
                    color: var(--text-dark);
                    font-size: 0.95em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .book-now-button {
                    display: block;
                    width: fit-content;
                    margin: 30px auto;
                    background-color: var(--homifi-dark-blue);
                    color: var(--bg-white);
                    border: none;
                    border-radius: 10px;
                    padding: 15px 30px;
                    font-size: 1.2em;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                .book-now-button:hover {
                    background-color: var(--homifi-deepest-blue);
                    transform: translateY(-2px);
                }

                .owner-contact-details {
                    background-color: var(--bg-soft-blue);
                    padding: 20px;
                    border-radius: 10px;
                    margin-top: 25px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                    text-align: center;
                }

                .owner-contact-details h3 {
                    font-family: var(--font-heading);
                    color: var(--homifi-dark-blue);
                    font-size: 1.5em;
                    margin-top: 0;
                    margin-bottom: 15px;
                }

                .owner-contact-details p {
                    font-size: 1.1em;
                    margin-bottom: 10px;
                }

                .owner-contact-details a {
                    color: var(--homifi-cyan);
                    text-decoration: none;
                    font-weight: 500;
                }

                .owner-contact-details a:hover {
                    text-decoration: underline;
                }

                /* General Modal Styles (for booking confirmation) */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .modal-content {
                    background-color: var(--bg-white);
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    max-width: 500px;
                    width: 90%;
                    position: relative;
                    animation: modalFadeIn 0.3s ease-out forwards;
                }

                @keyframes modalFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-30px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .modal-content h2 {
                    font-family: var(--font-heading);
                    color: var(--homifi-dark-blue);
                    font-size: 2em;
                    margin-bottom: 15px;
                }

                .modal-content p {
                    color: var(--text-medium);
                    font-size: 1.1em;
                    margin-bottom: 10px;
                }

                .modal-content p strong {
                    color: var(--text-dark);
                }

                .close-button {
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    font-size: 2em;
                    cursor: pointer;
                    color: var(--text-light);
                    transition: color 0.2s ease;
                }

                .close-button:hover {
                    color: var(--error-red);
                }

                .modal-ok-button {
                    background-color: var(--homifi-cyan);
                    color: var(--bg-white);
                    border: none;
                    border-radius: 8px;
                    padding: 12px 25px;
                    font-size: 1em;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                    margin-top: 20px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .modal-ok-button:hover {
                    background-color: var(--homifi-teal);
                    transform: translateY(-1px);
                }

                .modal-ok-button svg {
                    fill: currentColor; /* Ensures SVG color matches button text color */
                    width: 20px;
                    height: 20px;
                }

                /* Login Required Modal Styles */
                .login-required-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .login-required-modal-content {
                    background-color: var(--bg-white);
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    transform: translateY(-20px);
                    animation: fadeInScale 0.3s ease-out forwards;
                }

                .login-required-modal-content h2 {
                    font-family: var(--font-heading);
                    color: var(--homifi-dark-blue);
                    font-size: 1.8em;
                    margin-bottom: 15px;
                }

                .login-required-modal-content p {
                    color: var(--text-medium);
                    font-size: 1.1em;
                    margin-bottom: 25px;
                }

                .login-required-modal-actions {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                }

                .login-required-modal-button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1em;
                    font-weight: 600;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                }

                .login-required-modal-button.login {
                    background-color: var(--homifi-cyan);
                    color: var(--bg-white);
                }

                .login-required-modal-button.login:hover {
                    background-color: var(--homifi-teal);
                    transform: translateY(-1px);
                }

                .login-required-modal-button.close {
                    background-color: var(--border-light);
                    color: var(--text-dark);
                }

                .login-required-modal-button.close:hover {
                    background-color: var(--border-subtle);
                    transform: translateY(-1px);
                }

                /* Zoomed Image Modal Styles (new) */
                .zoomed-image-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.9); /* Darker overlay for image */
                    display: flex;
                    flex-direction: column; /* Allow content to stack */
                    justify-content: center;
                    align-items: center;
                    z-index: 2000; /* Higher z-index than other modals */
                    padding: 20px;
                }

                .zoomed-image-content {
                    position: relative;
                    max-width: 90%;
                    max-height: 90%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                }

                .zoomed-image {
                    max-width: 100%;
                    max-height: 80vh; /* Limit height to fit screen */
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                }

                .zoomed-image-caption {
                    color: white;
                    font-size: 1.1em;
                    text-align: center;
                    padding: 10px 20px;
                    background-color: rgba(0, 0, 0, 0.6);
                    border-radius: 8px;
                }

                .zoomed-nav-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background-color: rgba(255, 255, 255, 0.2); /* Lighter arrows for dark background */
                    color: white;
                    border: none;
                    padding: 15px;
                    cursor: pointer;
                    font-size: 2.5em;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: background-color 0.3s ease;
                    z-index: 2010; /* Above image */
                }

                .zoomed-nav-arrow:hover {
                    background-color: rgba(255, 255, 255, 0.4);
                }

                .zoomed-nav-arrow.left {
                    left: -70px; /* Position outside the image content */
                }

                .zoomed-nav-arrow.right {
                    right: -70px; /* Position outside the image content */
                }

                .zoomed-nav-arrow svg {
                    fill: currentColor;
                    width: 35px;
                    height: 35px;
                }

                .zoomed-close-button {
                    position: absolute;
                    top: -40px; /* Position above the image content */
                    right: -40px;
                    font-size: 3em;
                    cursor: pointer;
                    color: white;
                    transition: color 0.2s ease;
                    z-index: 2010;
                }

                .zoomed-close-button:hover {
                    color: var(--error-red);
                }


                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .pg-details-title {
                        font-size: 2em;
                    }

                    .pg-details-location {
                        font-size: 1em;
                    }

                    .pg-details-image-gallery {
                        height: 300px; /* Adjust height for smaller screens */
                    }

                    .sharing-options-grid,
                    .amenities-list {
                        grid-template-columns: 1fr;
                    }

                    .modal-content {
                        padding: 20px;
                    }

                    .modal-content h2 {
                        font-size: 1.5em;
                    }

                    .zoomed-nav-arrow {
                        width: 40px;
                        height: 40px;
                        font-size: 1.5em;
                        padding: 5px;
                    }
                    .zoomed-nav-arrow.left {
                        left: 10px; /* Adjust for smaller screens */
                    }
                    .zoomed-nav-arrow.right {
                        right: 10px; /* Adjust for smaller screens */
                    }
                    .zoomed-nav-arrow svg {
                        width: 25px;
                        height: 25px;
                    }
                    .zoomed-close-button {
                        top: 10px;
                        right: 10px;
                        font-size: 2em;
                    }
                }
            `}</style>
            <button onClick={() => navigate('/user-dashboard')} className="back-button-top">← Back to Listings</button>
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
                    <img
                        src={pgDetails.photos[mainGalleryImageIndex].url}
                        alt={`${pgDetails.pgName} - ${pgDetails.photos[mainGalleryImageIndex].caption || `Image ${mainGalleryImageIndex + 1}`}`}
                        className="pg-details-image"
                        onClick={() => handleImageClick(mainGalleryImageIndex)} // Click to zoom
                    />
                    {pgDetails.photos.length > 1 && ( // Only show arrows if more than one image
                        <>
                            <button onClick={handleMainGalleryPrev} className="image-nav-arrow left">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button onClick={handleMainGalleryNext} className="image-nav-arrow right">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.28 12.28a.75.75 0 0 0 0-1.06l-7.5-7.5a.75.75 0 0 0-1.06 1.06L14.69 12l-6.97 6.97a.75.75 0 1 0 1.06 1.06l7.5-7.5Z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="no-image-placeholder">No images available for this PG.</div>
            )}

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


            <button onClick={handleBookNow} className="book-now-button" disabled={!authReady}>
                {loading || !authReady ? "Loading..." : "Book Now"}
            </button>

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

            {/* Login Required Modal */}
            {showLoginRequiredModal && (
                <div className="login-required-modal-overlay">
                    <div className="login-required-modal-content">
                        <h2>Login Required</h2>
                        <p>You must be logged in to book this PG.</p>
                        <div className="login-required-modal-actions">
                            <button onClick={handleLoginRequiredModalLogin} className="login-required-modal-button login">Login</button>
                            <button onClick={() => setShowLoginRequiredModal(false)} className="login-required-modal-button close">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Zoomed Image Modal */}
            {zoomedImage && pgDetails.photos && pgDetails.photos.length > 0 && (
                <div className="zoomed-image-modal-overlay">
                    <div className="zoomed-image-content">
                        <span className="zoomed-close-button" onClick={() => setZoomedImage(null)}>&times;</span>
                        <img src={zoomedImage.url} alt={zoomedImage.caption} className="zoomed-image" />
                        {zoomedImage.caption && <p className="zoomed-image-caption">{zoomedImage.caption}</p>}

                        {pgDetails.photos.length > 1 && ( // Only show navigation if more than one image
                            <>
                                <button onClick={handleZoomedPrev} className="zoomed-nav-arrow left">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button onClick={handleZoomedNext} className="zoomed-nav-arrow right">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.28 12.28a.75.75 0 0 0 0-1.06l-7.5-7.5a.75.75 0 0 0-1.06 1.06L14.69 12l-6.97 6.97a.75.75 0 1 0 1.06 1.06l7.5-7.5Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PgDetails;
