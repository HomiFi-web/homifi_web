// src/pages/PgOwnerDashboard.jsx - Last updated: 2025-06-26
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import Firebase Storage functions
import './PgOwnerDashboard.css'; // Corrected import path

// Import logo image (assuming it's in src/assets and PgOwnerDashboard.jsx is in src/pages)
import homifiLogo from '../assets/logo.png'; 

// Declare global variables for ESLint and provide fallback values
const __initial_auth_token = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : '';
const __app_id = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';


const PgOwnerDashboard = () => {
  const navigate = useNavigate();
  const [pgName, setPgName] = useState('');
  const [pgOwnerName, setPgOwnerName] = useState('');
  const [pgOwnerEmail, setPgOwnerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [pgOwnerPhoneNumber, setPgOwnerPhoneNumber] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [photos, setPhotos] = useState([]); // Stores { url: string, caption: string }
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPgId, setCurrentPgId] = useState(null); // To store ID of PG being edited
  
  // New state for gender preference
  const [genderPreference, setGenderPreference] = useState(''); // 'male', 'female', 'unisex'

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [storage, setStorage] = useState(null); // New state for Firebase Storage
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(''); // To display user's email in sidebar
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userListings, setUserListings] = useState([]); // New state for owner's listings
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0); // New state for upload progress
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility

  // State to manage hovered button text in sidebar
  const [hoveredButton, setHoveredButton] = useState(null);

  // Message states for displaying feedback to the user
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'

  // Ref for the file input to clear its value
  const fileInputRef = useRef(null);
  const sidebarRef = useRef(null); // Ref for the sidebar menu to detect clicks outside

  // Individual error states for each field
  const [pgNameError, setPgNameError] = useState('');
  const [pgOwnerNameError, setPgOwnerNameError] = useState('');
  const [pgOwnerEmailError, setPgOwnerEmailError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [stateError, setStateError] = useState('');
  const [countryError, setCountryError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [pgOwnerPhoneNumberError, setPgOwnerPhoneNumberError] = useState('');
  const [photosError, setPhotosError] = useState('');
  const [sharingOptionsError, setSharingOptionsError] = useState('');
  const [facilitiesError, setFacilitiesError] = useState('');
  const [genderPreferenceError, setGenderPreferenceError] = useState(''); // New error state

  // Combined state for sharing options (1, 2, 3, 4 Share)
  const [sharingOptions, setSharingOptions] = useState([
    { type: '1 Share', status: '', price: '', hasMess: false },
    { type: '2 Share', status: '', price: '', hasMess: false },
    { type: '3 Share', status: '', price: '', hasMess: false },
    { type: '4 Share', status: '', price: '', hasMess: false },
  ]);

  // Predefined lists for amenities and services
  const amenitiesList = [
    'Attached Balcony', 'Air Conditioning', 'Attached Washroom', 'Storage Shelf',
    'Spacious Cupboard', 'Desert Cooler', 'Spacious Refrigerator', 'Washing Machine',
    'Flat Screen Television', 'Biometric Enabled Entry',
  ];

  const servicesList = [
    'Hot and Delicious Meals', 'High-Speed WIFI', 'Power Backup', 'Laundry Service',
    'Workout Zone', 'Professional Housekeeping', '24x7 Security Surveillance',
    'Hot Water Supply', 'Water Purifier', 'In-House Cafeteria',
  ];

  // Function to display messages to the user
  const displayMessage = useCallback((text, type, duration = 5000) => {
    setMessage(text);
    setMessageType(type);
    // Automatically clear success/info messages after a duration
    if (type !== 'error') { // Keep error messages until manually dismissed or new action
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, duration);
    }
  }, []);

  // Function to clear all form fields and errors
  const clearForm = useCallback(() => {
    console.log('clearForm called: Resetting form fields and errors.');
    console.log(`State before reset - PG Name: "${pgName}", Photos count: ${photos.length}, currentPgId: ${currentPgId}`);

    setPgName('');
    setPgOwnerName('');
    setPgOwnerEmail('');
    setAddress('');
    setState('');
    setCountry('');
    setPincode('');
    setPgOwnerPhoneNumber('');
    setLocationLink('');
    setPhotos([]); // Clear photos state
    setFacilities([]);
    setSharingOptions([
      { type: '1 Share', status: '', price: '', hasMess: false },
      { type: '2 Share', status: '', price: '', hasMess: false },
      { type: '3 Share', status: '', price: '', hasMess: false },
      { type: '4 Share', status: '', price: '', hasMess: false },
    ]);
    setCurrentPgId(null); // Clear current PG ID when adding a new one
    setGenderPreference(''); // Clear gender preference

    // Clear the file input's value directly
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      console.log('File input value cleared.');
    }

    // Clear all errors
    setPgNameError('');
    setPgOwnerNameError('');
    setPgOwnerEmailError('');
    setAddressError('');
    setStateError('');
    setCountryError('');
    setPincodeError('');
    setPgOwnerPhoneNumberError('');
    setPhotosError('');
    setSharingOptionsError('');
    setFacilitiesError('');
    setGenderPreferenceError('');
    setMessage(''); // Also clear general messages
    setMessageType('');

    console.log('Form reset initiated. Next render should show empty fields.');
  }, [pgName, photos, currentPgId]); // Dependencies added to useCallback for correct closure behavior and logging.


  // Firebase Initialization and Auth
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyCENbG6LtD_dVaNoqyoJuLmxiyTQNi6e0E", 
        authDomain: "homifi-4d283.firebaseapp.com",
        projectId: "homifi-4d283",
        storageBucket: "homifi-4d283.appspot.com", // This directly points to gs://homifi-4d283.firebasestorage.app
        messagingSenderId: "434013049134", 
        appId: "1:434013049134:web:YOUR_ACTUAL_WEB_APP_ID", 
      };

      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      const storageInstance = getStorage(app); // Initialize Firebase Storage

      setAuth(authInstance);
      setDb(dbInstance);
      setStorage(storageInstance); // Set storage instance

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          setUserEmail(user.email || 'Anonymous User');
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
      displayMessage(`Failed to initialize the application: ${error.message}. Please try again.`, 'error');
    }
  }, [displayMessage]);

  // Fetch user-specific listings when userId or db changes
  useEffect(() => {
    const fetchUserListings = async () => {
      if (db && userId) {
        try {
          const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
          const q = query(collection(db, `artifacts/${appId}/public/data/pg_listings`), where('ownerId', '==', userId));
          const querySnapshot = await getDocs(q);
          const listings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUserListings(listings);
          console.log("Fetched user listings:", listings);
        } catch (error) {
          console.error("Error fetching user listings:", error);
          displayMessage("Failed to load your existing PG listings.", 'error');
        }
      }
    };

    if (isAuthReady) {
        fetchUserListings();
    }
  }, [db, userId, isAuthReady, displayMessage]);

  // Handle changes for status or price of a specific sharing option
  const handleSharingOptionChange = (index, field, value) => {
    const newSharingOptions = [...sharingOptions];
    // Special handling for checkbox which returns boolean
    newSharingOptions[index][field] = (field === 'hasMess') ? value : value;
    setSharingOptions(newSharingOptions);
    setSharingOptionsError('');
  };

  const handleGenderChange = (e) => {
    setGenderPreference(e.target.value);
    setGenderPreferenceError('');
  };

  // Modified handlePhotoUpload to use Firebase Storage
  const handlePhotoUpload = async (e) => {
    setPhotosError('');
    if (!storage || !userId) {
        displayMessage("Storage not initialized or user not authenticated.", 'error');
        return;
    }

    if (e.target.files) {
      const filesToUpload = Array.from(e.target.files);
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/heic', 'image/png'];
      const maxFileSize = 30 * 1024 * 1024; // 30 MB

      const validFiles = [];
      let uploadError = '';

      for (const file of filesToUpload) {
        if (!allowedTypes.includes(file.type)) {
          uploadError = `File '${file.name}' is not a supported image type (JPG, JPEG, PNG, HEIC).`;
          break;
        }
        if (file.size > maxFileSize) {
          uploadError = `File '${file.name}' exceeds the 30MB limit.`;
          break;
        }
        validFiles.push(file);
      }

      if (uploadError) {
        setPhotosError(uploadError);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input
        return;
      }

      if (photos.length + validFiles.length > 10) {
        setPhotosError('You can upload a maximum of 10 photos in total.');
        if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input
        return;
      }

      setLoading(true); // Indicate loading for photo upload
      let uploadedCount = 0;
      const newPhotoEntries = [];

      try {
        for (const file of validFiles) {
          // Create a unique path in storage: pg_images/userId/timestamp_filename
          const storagePath = `pg_images/${userId}/${Date.now()}_${file.name}`;
          const imageRef = ref(storage, storagePath);
          await uploadBytes(imageRef, file);
          const downloadURL = await getDownloadURL(imageRef);
          
          newPhotoEntries.push({ url: downloadURL, caption: '' });
          uploadedCount++;
          setPhotoUploadProgress(Math.floor((uploadedCount / validFiles.length) * 100));
        }
        setPhotos(prevPhotos => [...prevPhotos, ...newPhotoEntries]);
        displayMessage("Photos uploaded successfully!", 'success', 3000);
        setPhotoUploadProgress(0); // Reset progress
      } catch (error) {
        console.error("Error uploading photos:", error);
        displayMessage(`Failed to upload photos: ${error.message}`, 'error');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Clear the input field
      }
    }
  };


  const handlePhotoCaptionChange = (index, caption) => {
    const newPhotos = [...photos];
    newPhotos[index].caption = caption;
    setPhotos(newPhotos);
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotosError('');
    displayMessage("Photo removed.", 'info', 2000);
    // If photos become empty, also clear the file input
    if (newPhotos.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFacilityChange = (facility) => {
    setFacilities((prevFacilities) => {
      const updatedFacilities = prevFacilities.includes(facility)
        ? prevFacilities.filter((f) => f !== facility)
        : [...prevFacilities, facility];
      setFacilitiesError('');
      return updatedFacilities;
    });
  };

  // Function to load a listing into the form for editing
  const loadListingForEdit = useCallback((listing) => {
    console.log('Loading listing for edit:', listing.id);
    setPgName(listing.pgName || '');
    setPgOwnerName(listing.pgOwnerName || '');
    setPgOwnerEmail(listing.pgOwnerEmail || '');
    setAddress(listing.address || '');
    setState(listing.state || '');
    setCountry(listing.country || '');
    setPincode(listing.pincode || '');
    setGenderPreference(listing.genderPreference || ''); // Load gender preference
    const storedPhoneNumber = listing.pgOwnerPhoneNumber || '';
    const codeMatch = storedPhoneNumber.match(/^\+(\d+)/); // Capture the country code digits
    if (codeMatch) {
      setCountryCode(codeMatch[0]); // e.g., "+91"
      setPgOwnerPhoneNumber(storedPhoneNumber.substring(codeMatch[0].length)); // Remaining digits
    } else {
      setCountryCode('+91'); // Default if no code found
      setPgOwnerPhoneNumber(storedPhoneNumber);
    }
    setLocationLink(listing.locationLink || '');
    // Photos now directly contain URLs from Firebase Storage
    setPhotos(listing.photos ? listing.photos.map(p => ({ url: p.url, caption: p.caption || '' })) : []);
    setFacilities(listing.facilities || []);
    
    // Populate sharing options, ensuring all 4 types are present and prices/status are set, including hasMess
    const updatedSharingOptions = sharingOptions.map(optionType => {
        const found = (listing.sharingOptions || []).find(so => so.type === optionType.type);
        return found ? { ...found } : { type: optionType.type, status: '', price: '', hasMess: false };
    });
    setSharingOptions(updatedSharingOptions);
    setCurrentPgId(listing.id);

    // Clear the file input's value directly when loading for edit
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Clear all errors and messages when loading for edit
    setPgNameError(''); setPgOwnerNameError(''); setPgOwnerEmailError(''); setAddressError('');
    setStateError(''); setCountryError(''); setPincodeError(''); setPgOwnerPhoneNumberError('');
    setPhotosError(''); setSharingOptionsError(''); setFacilitiesError(''); setGenderPreferenceError('');
    setMessage('');
    setMessageType('');
    displayMessage(`Editing listing: "${listing.pgName}"`, 'info', 3000);
  }, [sharingOptions, displayMessage]); // Dependency for sharingOptions to ensure correct mapping

  const handleSendForValidation = async () => {
    setLoading(true);
    // Clear all previous errors and messages before validation
    setPgNameError('');
    setPgOwnerNameError('');
    setPgOwnerEmailError('');
    setAddressError('');
    setStateError('');
    setCountryError('');
    setPincodeError('');
    setPgOwnerPhoneNumberError('');
    setPhotosError('');
    setSharingOptionsError('');
    setFacilitiesError('');
    setMessage('');
    setMessageType('');
    setGenderPreferenceError('');

    let isValid = true;

    if (!pgName) { setPgNameError('PG Name is required.'); isValid = false; }
    else if (!/^[a-zA-Z\s]+$/.test(pgName)) { setPgNameError('PG Name can only contain alphabets and spaces.'); isValid = false; }

    if (!pgOwnerName) { setPgOwnerNameError('PG Owner Name is required.'); isValid = false; }
    else if (!/^[a-zA-Z\s]+$/.test(pgOwnerName)) { setPgOwnerNameError('PG Owner Name can only contain alphabets and spaces.'); isValid = false; }

    if (!pgOwnerEmail) { setPgOwnerEmailError('PG Owner Email is required.'); isValid = false; }
    else if (!/\S+@\S+\.\S+/.test(pgOwnerEmail)) { setPgOwnerEmailError('Please enter a valid email address.'); isValid = false; }

    if (!genderPreference) { setGenderPreferenceError('Please select PG gender preference.'); isValid = false; } // New validation

    if (!address) { setAddressError('Address is required.'); isValid = false; }
    if (!state) { setStateError('State is required.'); isValid = false; }
    if (!country) { setCountryError('Country is required.'); isValid = false; }

    if (!pincode) { setPincodeError('Pincode is required.'); isValid = false; }
    else if (!/^\d+$/.test(pincode)) { setPincodeError('Pincode can only contain digits.'); isValid = false; }

    if (!pgOwnerPhoneNumber) { setPgOwnerPhoneNumberError('Phone Number is required.'); isValid = false; }
    else if (!/^\d+$/.test(pgOwnerPhoneNumber)) { setPgOwnerPhoneNumberError('Phone Number can only contain digits.'); isValid = false; }

    if (photos.length < 3) { setPhotosError('Please upload a minimum of 3 photos.'); isValid = false; }
    else if (photos.length > 10) { setPhotosError('You can upload a maximum of 10 photos.'); isValid = false; }

    const activeSharingOptions = sharingOptions.filter(
      (option) => option.status || option.price
    );
    if (activeSharingOptions.length === 0) {
      setSharingOptionsError('Please provide availability and price for at least one sharing option.');
      isValid = false;
    } else {
      let missingPriceForAvailable = false;
      activeSharingOptions.forEach(option => {
        if (option.status === 'Available' && !option.price) {
          missingPriceForAvailable = true;
        }
      });
      if (missingPriceForAvailable) {
        setSharingOptionsError('Please provide prices for all available sharing options.');
        isValid = false;
      }
    }

    if (facilities.length === 0) { setFacilitiesError('Please select at least one facility/amenity.'); isValid = false; }

    if (!isValid) {
      setLoading(false);
      displayMessage('Please correct the highlighted errors.', 'error');
      return;
    }

    if (!db || !userId) {
      displayMessage("Application not ready. Please wait for Firebase to initialize and user to authenticate.", 'error');
      setLoading(false);
      return;
    }

    try {
      // Ensure the phone number is correctly formatted before saving
      const fullPhoneNumber = `${countryCode}${pgOwnerPhoneNumber}`;

      const pgDetailsToSave = {
        pgName,
        pgOwnerName,
        pgOwnerEmail,
        ownerId: userId,
        genderPreference, // Save gender preference
        address,
        state,
        country,
        pincode,
        pgOwnerPhoneNumber: fullPhoneNumber, // Use the correctly formatted phone number
        locationLink,
        sharingOptions: activeSharingOptions, // includes hasMess now
        photos: photos.map(p => ({ url: p.url, caption: p.caption })), // Photos array contains URLs
        facilities,
        status: 'pending',
        createdAt: new Date(),
      };

      // --- Save/Update Owner Details to 'pg_owners' collection ---
      const ownerDetailsToSave = {
        name: pgOwnerName,
        email: pgOwnerEmail,
        phone: fullPhoneNumber, 
      };
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      await setDoc(doc(db, `artifacts/${appId}/users/${userId}/pg_owners`), ownerDetailsToSave, { merge: true });
      console.log("Owner details saved/updated for userId: ", userId);
      // --- END CRITICAL ADDITION ---


      if (currentPgId) {
        // Update existing document in pg_listings
        await updateDoc(doc(db, `artifacts/${appId}/public/data/pg_listings`, currentPgId), pgDetailsToSave);
        console.log("Document updated with ID: ", currentPgId);
        displayMessage(`PG details for "${pgName}" updated successfully!`, 'success'); 
      } else {
        // Add new document to pg_listings
        const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/pg_listings`), pgDetailsToSave);
        console.log("Document written with ID: ", docRef.id);
        displayMessage(`PG details for "${pgName}" submitted for verification! An email will be sent to ${pgOwnerEmail} regarding the status.`, 'success'); 
      }
      
      clearForm(); // Clear form after successful submission/update
      
      // Re-fetch listings to update the displayed list
      const q = query(collection(db, `artifacts/${appId}/public/data/pg_listings`), where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserListings(listings);

    } catch (e) {
      console.error("Error adding/updating document: ", e);
      displayMessage(`Failed to submit PG details: ${e.message}. Please try again.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnotherBuilding = () => {
    console.log('Add Another Building button clicked. Current loading state:', loading);
    clearForm(); // Clears the form to add a new building
    displayMessage('Form cleared. Ready to add a new building.', 'info', 3000);
    console.log('Form reset initiated by Add Another Building button.');
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        setUserId(null);
        setUserEmail('');
        setUserListings([]);
        console.log("User logged out successfully.");
        navigate('/login');
      } catch (error) {
        console.error("Error logging out:", error);
        displayMessage(`Failed to log out: ${error.message}`, 'error');
      }
    }
  };

  const handleResetPassword = async () => {
    if (auth && userEmail && userEmail !== 'Anonymous User') {
      try {
        await sendPasswordResetEmail(auth, userEmail);
        displayMessage('Password reset email sent! Please check your inbox.', 'success'); 
      } catch (error) {
        console.error("Error sending password reset email:", error);
        displayMessage(`Failed to send password reset email: ${error.message}`, 'error');
      }
    } else {
      displayMessage("Cannot reset password for anonymous or invalid users.", 'error');
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(prevState => !prevState);
  };

  // Close sidebar if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  if (!isAuthReady) {
    return (
      <div className="loading-container">
        <p className="text-center">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="pg-owner-dashboard-container"> {/* Main container for the top nav layout */}
      {/* Top Navigation Bar */}
      <nav className="top-nav-bar">
        <div className="top-nav-left">
          <img src={homifiLogo} alt="HomiFi Logo" className="top-nav-logo" /> 
        </div>
        <div className="top-nav-right">
          <ul className="top-nav-menu">
            <li className="top-nav-menu-item profile-menu-item" onClick={toggleSidebar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
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
          <p className="sidebar-user-email">{userEmail || 'PG Owner'}</p>
          
          {/* Dashboard Button */}
          <button 
            onClick={() => { navigate('/pg-owner-dashboard'); setIsSidebarOpen(false); }} 
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('dashboard')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trello">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="7" y="7" width="3" height="9"></rect>
              <rect x="14" y="7" width="3" height="5"></rect>
            </svg>
            <span>{hoveredButton === 'dashboard' ? 'Go to Dashboard' : 'Dashboard'}</span>
          </button>

          {/* View Status Button */}
          <button 
            onClick={() => { 
                const listingsSection = document.getElementById('owner-listings-section'); 
                if (listingsSection) listingsSection.scrollIntoView({ behavior: 'smooth' }); 
                setIsSidebarOpen(false); 
            }} 
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('status')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-check-square">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            <span>{hoveredButton === 'status' ? 'Check Status' : 'View Status'}</span>
          </button>

          {/* View Notifications Button */}
          <button 
            onClick={() => { displayMessage('Notifications feature coming soon!', 'info'); setIsSidebarOpen(false); }} 
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('notifications')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-bell">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span>{hoveredButton === 'notifications' ? 'See Alerts' : 'View Notifications'}</span>
          </button>

          {/* Reset Password Button */}
          <button 
            onClick={() => { handleResetPassword(); setIsSidebarOpen(false); }} 
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('reset-password')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-key">
              <path d="M5 14L12 14 12 22 5 22 5 14z"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>{hoveredButton === 'reset-password' ? 'Change Password' : 'Reset Password'}</span>
          </button>
          
          {/* Logout Button */}
          <button 
            onClick={() => { handleLogout(); setIsSidebarOpen(false); }} 
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('logout')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-out">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>{hoveredButton === 'logout' ? 'Sign Out' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Message Box */}
        {message && (
          <div className={`app-message-box ${messageType}`}>
            <p>{message}</p>
            <button className="app-message-box-close-button" onClick={() => setMessage('')}>&times;</button>
          </div>
        )}

        <div className="pg-details-form-card">
          <h2 className="form-title">{currentPgId ? 'Edit PG Property Details' : 'Add New PG Property Details'}</h2>
          
          {/* New: Gender Preference */}
          <div className="form-group-wrapper">
              <div className="form-group">
                  <label className="form-label">
                      PG for <span className="required-field">*</span>
                  </label>
                  <div className="gender-preference-radio-group">
                      <label>
                          <input 
                              type="radio" 
                              name="genderPreference" 
                              value="male" 
                              checked={genderPreference === 'male'} 
                              onChange={handleGenderChange} 
                          /> Male
                      </label>
                      <label>
                          <input 
                              type="radio" 
                              name="genderPreference" 
                              value="female" 
                              checked={genderPreference === 'female'} 
                              onChange={handleGenderChange} 
                          /> Female
                      </label>
                      <label>
                          <input 
                              type="radio" 
                              name="genderPreference" 
                              value="unisex" 
                              checked={genderPreference === 'unisex'} 
                              onChange={handleGenderChange} 
                          /> Unisex
                      </label>
                  </div>
              </div>
              {genderPreferenceError && <p className="field-error-message">{genderPreferenceError}</p>}
          </div>

          {/* Form Fields - PG Name */}
          <div className="form-group-wrapper">
            <div className="form-group">
              <label htmlFor="pgName" className="form-label">
                PG Name <span className="required-field">*</span>
              </label>
              <input
                id="pgName"
                type="text"
                value={pgName}
                onChange={(e) => { setPgName(e.target.value.replace(/[^a-zA-Z\s]/g, '')); setPgNameError(''); }}
                placeholder="Enter PG Name"
                className="form-input"
                required
              />
            </div>
            {pgNameError && <p className="field-error-message">{pgNameError}</p>}
          </div>

          {/* Form Fields - PG Owner Name */}
          <div className="form-group-wrapper">
            <div className="form-group">
              <label htmlFor="pgOwnerName" className="form-label">
                PG Owner Name <span className="required-field">*</span>
              </label>
              <input
                id="pgOwnerName"
                type="text"
                value={pgOwnerName}
                onChange={(e) => { setPgOwnerName(e.target.value.replace(/[^a-zA-Z\s]/g, '')); setPgOwnerNameError(''); }}
                placeholder="Enter PG Owner's Name"
                className="form-input"
                required
              />
            </div>
            {pgOwnerNameError && <p className="field-error-message">{pgOwnerNameError}</p>}
          </div>

          {/* Form Fields - PG Owner Email */}
          <div className="form-group-wrapper">
            <div className="form-group">
              <label htmlFor="pgOwnerEmail" className="form-label">
                PG Owner Email <span className="required-field">*</span>
              </label>
              <input
                id="pgOwnerEmail"
                type="email"
                value={pgOwnerEmail}
                onChange={(e) => { setPgOwnerEmail(e.target.value); setPgOwnerEmailError(''); }}
                placeholder="Enter PG Owner's Email"
                className="form-input"
                required
              />
            </div>
            {pgOwnerEmailError && <p className="field-error-message">{pgOwnerEmailError}</p>}
          </div>

          {/* Phone Number */}
          <div className="form-group-wrapper">
            <div className="form-group">
              <label htmlFor="pgOwnerPhoneNumber" className="form-label">
                PG Owner Phone Number <span className="required-field">*</span>
              </label>
              <div className="phone-input-group">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="form-select country-code-select"
                >
                  <option value="+91">+91 (India)</option>
                  <option value="+1">+1 (USA/Canada)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (Australia)</option>
                  <option value="+49">+49 (Germany)</option>
                  <option value="+33">+33 (France)</option>
                  <option value="+81">+81 (Japan)</option>
                  <option value="+86">+86 (China)</option>
                  <option value="+55">+55 (Brazil)</option>
                  <option value="+27">+27 (South Africa)</option>
                </select>
                <input
                  id="pgOwnerPhoneNumber"
                  type="tel"
                  value={pgOwnerPhoneNumber}
                  onChange={(e) => { setPgOwnerPhoneNumber(e.target.value.replace(/[^0-9]/g, '')); setPgOwnerPhoneNumberError(''); }}
                  placeholder="e.g., 9876543210"
                  className="form-input phone-number-input"
                  required
                />
              </div>
            </div>
            {pgOwnerPhoneNumberError && <p className="field-error-message">{pgOwnerPhoneNumberError}</p>}
          </div>

          {/* Address */}
          <div className="form-group-wrapper">
            <div className="form-group">
              <label htmlFor="address" className="form-label">
                Address <span className="required-field">*</span>
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setAddressError(''); }}
                placeholder="Enter full address including street, locality"
                className="form-textarea"
                rows="3"
                required
              />
            </div>
            {addressError && <p className="field-error-message">{addressError}</p>}
          </div>

          {/* State & Country */}
          <div className="form-group-inline-wrapper">
            <div className="form-group-half-wrapper">
              <div className="form-group form-group-half">
                <label htmlFor="state" className="form-label">
                  State <span className="required-field">*</span>
                </label>
                <input
                  id="state"
                  type="text"
                  value={state}
                  onChange={(e) => { setState(e.target.value); setStateError(''); }}
                  placeholder="e.g., Karnataka"
                  className="form-input"
                  required
                />
              </div>
              {stateError && <p className="field-error-message">{stateError}</p>}
            </div>
            <div className="form-group-half-wrapper">
              <div className="form-group form-group-half">
                <label htmlFor="country" className="form-label">
                  Country <span className="required-field">*</span>
                </label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setCountryError(''); }}
                  placeholder="e.g., India"
                  className="form-input"
                  required
                />
              </div>
              {countryError && <p className="field-error-message">{countryError}</p>}
            </div>
          </div>

          {/* Pincode */}
          <div className="form-group-wrapper">
            <div className="form-group">
              <label htmlFor="pincode" className="form-label">
                Pincode <span className="required-field">*</span>
              </label>
              <input
                id="pincode"
                type="text"
                value={pincode}
                onChange={(e) => { setPincode(e.target.value.replace(/[^0-9]/g, '')); setPincodeError(''); }}
                placeholder="e.g., 560001"
                className="form-input"
                required
              />
            </div>
            {pincodeError && <p className="field-error-message">{pincodeError}</p>}
          </div>

          {/* Location Link */}
          <div className="form-group-wrapper">
            <div className="form-group">
              <label htmlFor="locationLink" className="form-label">
                Location Link (Optional - Google Maps URL)
              </label>
              <input
                id="locationLink"
                type="url"
                value={locationLink}
                onChange={(e) => setLocationLink(e.target.value)}
                placeholder="e.g., https://goo.gl/maps/example"
                className="form-input"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="form-group-wrapper">
            <div className="form-group">
              <label htmlFor="photos" className="form-label">
                Photos of PG <span className="required-field">*</span> (Min 3, Max 10, JPG/JPEG/PNG/HEIC, &lt;30MB each)
              </label>
              <input
                id="photos"
                type="file"
                multiple
                onChange={handlePhotoUpload}
                className="form-input"
                accept="image/jpeg, image/jpg, image/png, image/heic"
                ref={fileInputRef} 
              />
            </div>
            {loading && photoUploadProgress > 0 && (
                <p className="loading-message">Uploading photos: {photoUploadProgress}%</p>
            )}
            {photosError && <p className="field-error-message">{photosError}</p>}
            {photos.length > 0 && (
              <div className="photo-preview-grid">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-preview-item">
                    <img
                      src={photo.url}
                      alt={photo.caption || `Uploaded ${index + 1}`}
                      className="photo-preview-image"
                    />
                    <textarea
                      value={photo.caption}
                      onChange={(e) => handlePhotoCaptionChange(index, e.target.value)}
                      placeholder="Add caption..."
                      className="photo-caption-input"
                      rows="2"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="remove-photo-button"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Availability & Pricing (with Mess Option) */}
          <div className="form-group-wrapper">
            <div className="form-group">
              <label className="form-label">
                Availability & Pricing <span className="required-field">*</span>
              </label>
              <div className="sharing-options-grid">
                {sharingOptions.map((option, optionIndex) => (
                  <div key={option.type} className="sharing-option-item">
                    <div className="sharing-details-stack">
                      <label className="sharing-option-label">{option.type}</label>
                      <select
                        value={option.status}
                        onChange={(e) => handleSharingOptionChange(optionIndex, 'status', e.target.value)}
                        className="form-select sharing-status-select"
                      >
                        <option value="">Status</option>
                        <option value="Available">Available</option>
                        <option value="Full">Full</option>
                      </select>
                      <div className="price-input-wrapper">
                        <span className="rupee-symbol">₹</span>
                        <input
                          type="number"
                          value={option.price}
                          onChange={(e) => handleSharingOptionChange(optionIndex, 'price', e.target.value)}
                          placeholder="Price"
                          className="form-input sharing-price-input"
                          disabled={option.status === 'Full'}
                        />
                      </div>
                      {/* New: Mess Option */}
                      <label className="mess-checkbox-label">
                          <input
                              type="checkbox"
                              checked={option.hasMess}
                              onChange={(e) => handleSharingOptionChange(optionIndex, 'hasMess', e.target.checked)}
                          /> Mess Included
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {sharingOptionsError && <p className="field-error-message">{sharingOptionsError}</p>}
          </div>

          {/* Amenities and Services Checkboxes */}
          <div className="form-group-wrapper">
            <div className="amenities-section">
              <h4>Amenities</h4>
              <div className="amenities-checkbox-grid">
                {amenitiesList.map((amenity) => (
                  <div key={amenity} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={amenity.replace(/\s/g, '-').toLowerCase()}
                      checked={facilities.includes(amenity)}
                      onChange={() => handleFacilityChange(amenity)}
                    />
                    <label htmlFor={amenity.replace(/\s/g, '-').toLowerCase()}>
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>

              <h4>Services</h4>
              <div className="amenities-checkbox-grid">
                {servicesList.map((service) => (
                  <div key={service} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={service.replace(/\s/g, '-').toLowerCase()}
                      checked={facilities.includes(service)}
                      onChange={() => handleFacilityChange(service)}
                    />
                    <label htmlFor={service.replace(/\s/g, '-').toLowerCase()}>
                      {service}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {facilitiesError && <p className="field-error-message">{facilitiesError}</p>}
          </div>

          <div className="form-actions">
            <button
              onClick={handleSendForValidation}
              className="button button-primary"
              disabled={loading}
            >
              {currentPgId ? (loading ? 'Updating...' : 'Update PG Details') : (loading ? 'Sending...' : 'Send for Validation')}
            </button>
            
            <button
              onClick={handleAddAnotherBuilding}
              className="button button-secondary"
              disabled={loading}
            >
              Add Another Building
            </button>
          </div>
        </div>

        {/* Section to display current owner's listings */}
        {userListings.length > 0 && (
          <div id="owner-listings-section" className="owner-listings-section"> {/* Added ID for scrolling */}
            <h2 className="section-title">Your Existing PG Listings</h2>
            <div className="listings-grid">
              {userListings.map((listing) => (
                <div key={listing.id} className="listing-card">
                  <h3>{listing.pgName}</h3>
                  <p>Address: {listing.address}, {listing.state}</p>
                  <p>Contact: {listing.pgOwnerPhoneNumber}</p>
                  <p>Status: {listing.status}</p>
                  <button 
                    onClick={() => loadListingForEdit(listing)} 
                    className="button button-outline button-small"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PgOwnerDashboard;
