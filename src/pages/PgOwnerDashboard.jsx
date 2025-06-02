// src/pages/PgOwnerDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore'; // Ensure setDoc is imported
import './PgOwnerDashboard.css'; // Corrected import path

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
  const [photos, setPhotos] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPgId, setCurrentPgId] = useState(null); // To store ID of PG being edited
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(''); // To display user's email in sidebar
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userListings, setUserListings] = useState([]); // New state for owner's listings

  // Ref for the file input to clear its value
  const fileInputRef = useRef(null);

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
  const [generalError, setGeneralError] = useState('');

  // Combined state for sharing options (1, 2, 3, 4 Share)
  const [sharingOptions, setSharingOptions] = useState([
    { type: '1 Share', status: '', price: '' },
    { type: '2 Share', status: '', price: '' },
    { type: '3 Share', status: '', price: '' },
    { type: '4 Share', status: '', price: '' },
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

  // Function to clear all form fields and errors
  const clearForm = useCallback(() => {
    console.log('clearForm called: Resetting form fields and errors.');
    // Log current state before reset for debugging
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
      { type: '1 Share', status: '', price: '' },
      { type: '2 Share', status: '', price: '' },
      { type: '3 Share', status: '', price: '' },
      { type: '4 Share', status: '', price: '' },
    ]);
    setCurrentPgId(null); // Clear current PG ID when adding a new one

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
    setGeneralError('');

    console.log('Form reset initiated. Next render should show empty fields.');
  }, []); // Removed dependencies from useCallback as it only uses setter functions

  // Firebase Initialization and Auth
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A",
        authDomain: "homifi-bac92.firebaseapp.com",
        projectId: "homifi-bac92",
        storageBucket: "homifi-bac92.appspot.com",
        messagingSenderId: "876737044340",
        appId: "1:876737044340:web:07d098db6f17f9c80bd621"
      };

      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

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
      setGeneralError(`Failed to initialize the application: ${error.message}. Please try again.`);
    }
  }, []);

  // Fetch user-specific listings when userId or db changes
  useEffect(() => {
    const fetchUserListings = async () => {
      if (db && userId) {
        try {
          const q = query(collection(db, 'pg_listings'), where('ownerId', '==', userId));
          const querySnapshot = await getDocs(q);
          const listings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUserListings(listings);
          console.log("Fetched user listings:", listings);
        } catch (error) {
          console.error("Error fetching user listings:", error);
          setGeneralError("Failed to load your existing PG listings.");
        }
      }
    };

    if (isAuthReady) {
        fetchUserListings();
    }
  }, [db, userId, isAuthReady]);

  // Handle changes for status or price of a specific sharing option
  const handleSharingOptionChange = (index, field, value) => {
    const newSharingOptions = [...sharingOptions];
    newSharingOptions[index][field] = value;
    setSharingOptions(newSharingOptions);
    setSharingOptionsError('');
  };

  const handlePhotoUpload = (e) => {
    setPhotosError('');
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/heic', 'image/png'];
      const maxFileSize = 30 * 1024 * 1024;

      const validNewFiles = [];
      let uploadError = '';

      for (const file of newFiles) {
        if (!allowedTypes.includes(file.type)) {
          uploadError = `File '${file.name}' is not a supported image type (JPG, JPEG, PNG, HEIC).`;
          break;
        }
        if (file.size > maxFileSize) {
          uploadError = `File '${file.name}' exceeds the 30MB limit.`;
          break;
        }
        validNewFiles.push(file);
      }

      if (uploadError) {
        setPhotosError(uploadError);
        e.target.value = null; // Clear the input value
        return;
      }

      if (photos.length + validNewFiles.length > 10) {
        setPhotosError('You can upload a maximum of 10 photos in total.');
        e.target.value = null; // Clear the input value
        return;
      }

      const newPhotoEntries = validNewFiles.map(file => ({
        file: file,
        caption: '',
        url: URL.createObjectURL(file)
      }));
      setPhotos(prevPhotos => [...prevPhotos, ...newPhotoEntries]);
      e.target.value = null; // Clear the input value after adding files
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
    // Ensure photos are correctly mapped to expected structure
    setPhotos(listing.photos ? listing.photos.map(p => ({ url: p.url, caption: p.caption || '', file: null })) : []);
    setFacilities(listing.facilities || []);
    
    // Populate sharing options, ensuring all 4 types are present and prices/status are set
    const updatedSharingOptions = sharingOptions.map(optionType => {
        const found = (listing.sharingOptions || []).find(so => so.type === optionType.type);
        return found ? { ...found } : { type: optionType.type, status: '', price: '' };
    });
    setSharingOptions(updatedSharingOptions);
    setCurrentPgId(listing.id);

    // Clear the file input's value directly when loading for edit
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Clear all errors when loading for edit
    setPgNameError(''); setPgOwnerNameError(''); setPgOwnerEmailError(''); setAddressError('');
    setStateError(''); setCountryError(''); setPincodeError(''); setPgOwnerPhoneNumberError('');
    setPhotosError(''); setSharingOptionsError(''); setFacilitiesError(''); setGeneralError('');
  }, [sharingOptions]); // Dependency for sharingOptions to ensure correct mapping

  const handleSendForValidation = async () => {
    setLoading(true);
    // Clear all previous errors before validation
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
    setGeneralError('');

    let isValid = true;

    if (!pgName) { setPgNameError('PG Name is required.'); isValid = false; }
    else if (!/^[a-zA-Z\s]+$/.test(pgName)) { setPgNameError('PG Name can only contain alphabets and spaces.'); isValid = false; }

    if (!pgOwnerName) { setPgOwnerNameError('PG Owner Name is required.'); isValid = false; }
    else if (!/^[a-zA-Z\s]+$/.test(pgOwnerName)) { setPgOwnerNameError('PG Owner Name can only contain alphabets and spaces.'); isValid = false; }

    if (!pgOwnerEmail) { setPgOwnerEmailError('PG Owner Email is required.'); isValid = false; }
    else if (!/\S+@\S+\.\S+/.test(pgOwnerEmail)) { setPgOwnerEmailError('Please enter a valid email address.'); isValid = false; }

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
      return;
    }

    if (!db || !userId) {
      setGeneralError("Application not ready. Please wait for Firebase to initialize and user to authenticate.");
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
        address,
        state,
        country,
        pincode,
        pgOwnerPhoneNumber: fullPhoneNumber, // Use the correctly formatted phone number
        locationLink,
        sharingOptions: activeSharingOptions,
        photos: photos.map(p => ({ url: p.url, caption: p.caption })),
        facilities,
        status: 'pending',
        createdAt: new Date(),
      };

      // --- CRITICAL ADDITION: Save/Update Owner Details to 'pg_owners' collection ---
      const ownerDetailsToSave = {
        name: pgOwnerName,
        email: pgOwnerEmail,
        // Make sure the phone number here is also the correctly formatted one
        phone: fullPhoneNumber, 
        // You can add other owner-specific fields here if needed
      };
      // Use setDoc with userId as the document ID to create or overwrite the owner's document
      await setDoc(doc(db, 'pg_owners', userId), ownerDetailsToSave, { merge: true });
      console.log("Owner details saved/updated for userId: ", userId);
      // --- END CRITICAL ADDITION ---


      if (currentPgId) {
        // Update existing document in pg_listings
        await updateDoc(doc(db, 'pg_listings', currentPgId), pgDetailsToSave);
        console.log("Document updated with ID: ", currentPgId);
        alert(`PG details for "${pgName}" updated successfully!`);
      } else {
        // Add new document to pg_listings
        const docRef = await addDoc(collection(db, `pg_listings`), pgDetailsToSave);
        console.log("Document written with ID: ", docRef.id);
        alert(`PG details for "${pgName}" submitted for verification! An email will be sent to ${pgOwnerEmail} regarding the status.`);
      }
      
      clearForm(); // Clear form after successful submission/update
      
      // Re-fetch listings to update the displayed list
      const q = query(collection(db, 'pg_listings'), where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserListings(listings);

    } catch (e) {
      console.error("Error adding/updating document: ", e);
      setGeneralError("Failed to submit PG details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnotherBuilding = () => {
    console.log('Add Another Building button clicked. Current loading state:', loading);
    clearForm(); // Clears the form to add a new building
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
        setGeneralError(`Failed to log out: ${error.message}`);
      }
    }
  };

  const handleResetPassword = async () => {
    if (auth && userEmail && userEmail !== 'Anonymous User') {
      try {
        await sendPasswordResetEmail(auth, userEmail);
        alert('Password reset email sent! Please check your inbox.');
      } catch (error) {
        console.error("Error sending password reset email:", error);
        setGeneralError(`Failed to send password reset email: ${error.message}`);
      }
    } else {
      setGeneralError("Cannot reset password for anonymous or invalid users.");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!isAuthReady) {
    return (
      <div className="loading-container">
        <p className="text-center">Loading application...</p>
      </div>
    );
  }

  return (
    <div className={`pg-owner-dashboard-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="welcome-message">Welcome, PG Owner!</h2>
          {userEmail && <p className="user-email">{userEmail}</p>}
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button onClick={handleResetPassword} className="sidebar-button reset-password-button">
                Reset Password
              </button>
            </li>
            <li>
              <button onClick={handleLogout} className="sidebar-button logout-button">
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Hamburger Icon to toggle sidebar */}
        <div className={`Icon ${isSidebarOpen ? 'open' : ''}`} onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="pg-details-form-card">
          <h2 className="form-title">{currentPgId ? 'Edit PG Property Details' : 'Add New PG Property Details'}</h2>
          {/* Form Fields */}
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
            {photosError && <p className="field-error-message">{photosError}</p>}
            {photos.length > 0 && (
              <div className="photo-preview-grid">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-preview-item">
                    <img
                      src={photo.url}
                      alt={`Uploaded ${index + 1}`}
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {sharingOptionsError && <p className="field-error-message">{sharingOptionsError}</p>}
          </div>

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

          {generalError && <p className="error-error-message">{generalError}</p>}

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
          <div className="owner-listings-section">
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