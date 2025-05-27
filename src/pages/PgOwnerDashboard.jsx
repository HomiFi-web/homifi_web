import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import './PgOwnerDashboard.css'; // Import the CSS file

// Declare global variables for ESLint and provide fallback values
// These are typically injected by the Canvas environment, but hardcoding for local dev
const __initial_auth_token = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : '';
const __app_id = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';


const PgOwnerDashboard = () => {
  const navigate = useNavigate();
  const [pgName, setPgName] = useState('');
  const [pgOwnerName, setPgOwnerName] = useState('');
  const [pgOwnerEmail, setPgOwnerEmail] = useState(''); // New state for PG Owner Email
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [countryCode, setCountryCode] = useState('+91'); // Default country code
  const [pgOwnerPhoneNumber, setPgOwnerPhoneNumber] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [photos, setPhotos] = useState([]); // Array of { file: File, caption: string, url: string }
  const [facilities, setFacilities] = useState([]); // Changed to an array for checkboxes
  const [loading, setLoading] = useState(false);

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Individual error states for each field
  const [pgNameError, setPgNameError] = useState('');
  const [pgOwnerNameError, setPgOwnerNameError] = useState('');
  const [pgOwnerEmailError, setPgOwnerEmailError] = useState(''); // New error state
  const [addressError, setAddressError] = useState('');
  const [stateError, setStateError] = useState('');
  const [countryError, setCountryError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [pgOwnerPhoneNumberError, setPgOwnerPhoneNumberError] = useState('');
  const [photosError, setPhotosError] = useState('');
  const [sharingOptionsError, setSharingOptionsError] = useState('');
  const [facilitiesError, setFacilitiesError] = useState('');
  const [generalError, setGeneralError] = useState(''); // For overall form errors

  // Combined state for sharing options (1, 2, 3, 4 Share)
  const [sharingOptions, setSharingOptions] = useState([
    { type: '1 Share', status: '', price: '' },
    { type: '2 Share', status: '', price: '' },
    { type: '3 Share', status: '', price: '' },
    { type: '4 Share', status: '', price: '' },
  ]);

  // Predefined lists for amenities and services
  const amenitiesList = [
    'Attached Balcony',
    'Air Conditioning',
    'Attached Washroom',
    'Storage Shelf',
    'Spacious Cupboard',
    'Desert Cooler',
    'Spacious Refrigerator',
    'Washing Machine',
    'Flat Screen Television',
    'Biometric Enabled Entry',
  ];

  const servicesList = [
    'Hot and Delicious Meals',
    'High-Speed WIFI',
    'Power Backup',
    'Laundry Service',
    'Workout Zone',
    'Professional Housekeeping',
    '24x7 Security Surveillance',
    'Hot Water Supply',
    'Water Purifier',
    'In-House Cafeteria',
  ];

  // Firebase Initialization and Auth
  useEffect(() => {
    try {
      // Hardcode Firebase config for local development
      const firebaseConfig = {
        apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A", // Your Web API Key
        authDomain: "helphomifi-bac92.firebaseapp.com",
        projectId: "helphomifi-bac92",
        storageBucket: "helphomifi-bac92.appspot.com",
        messagingSenderId: "876737044340", // Your Project number
        appId: "1:876737044340:web:07d098db6f17f9c80bd621", // This is derived from Project Number and Web API Key
        // measurementId: "G-XXXXXXXXXX" // Optional: if you use Google Analytics for Firebase
      };
      
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
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

  // Handle changes for status or price of a specific sharing option
  const handleSharingOptionChange = (index, field, value) => {
    const newSharingOptions = [...sharingOptions];
    newSharingOptions[index][field] = value;
    setSharingOptions(newSharingOptions);
    setSharingOptionsError(''); // Clear error on change
  };

  const handlePhotoUpload = (e) => {
    setPhotosError(''); // Clear previous photo errors
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/heic', 'image/png'];
      const maxFileSize = 30 * 1024 * 1024; // 30 MB

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
        e.target.value = null;
        return;
      }

      if (photos.length + validNewFiles.length > 10) {
        setPhotosError('You can upload a maximum of 10 photos in total.');
        e.target.value = null;
        return;
      }

      const newPhotoEntries = validNewFiles.map(file => ({
        file: file,
        caption: '',
        url: URL.createObjectURL(file)
      }));
      setPhotos(prevPhotos => [...prevPhotos, ...newPhotoEntries]);
      e.target.value = null;
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
  };

  // Handle checkbox change for facilities
  const handleFacilityChange = (facility) => {
    setFacilities((prevFacilities) => {
      const updatedFacilities = prevFacilities.includes(facility)
        ? prevFacilities.filter((f) => f !== facility)
        : [...prevFacilities, facility];
      setFacilitiesError('');
      return updatedFacilities;
    });
  };

  const handleEdit = () => {
    console.log('Edit functionality triggered.');
  };

  const handleSendForValidation = async () => {
    setLoading(true);
    // Clear all previous errors
    setPgNameError('');
    setPgOwnerNameError('');
    setPgOwnerEmailError(''); // Clear new error state
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

    // Validate PG Name
    if (!pgName) { setPgNameError('PG Name is required.'); isValid = false; }
    else if (!/^[a-zA-Z\s]+$/.test(pgName)) { setPgNameError('PG Name can only contain alphabets and spaces.'); isValid = false; }

    // Validate PG Owner Name
    if (!pgOwnerName) { setPgOwnerNameError('PG Owner Name is required.'); isValid = false; }
    else if (!/^[a-zA-Z\s]+$/.test(pgOwnerName)) { setPgOwnerNameError('PG Owner Name can only contain alphabets and spaces.'); isValid = false; }

    // Validate PG Owner Email
    if (!pgOwnerEmail) { setPgOwnerEmailError('PG Owner Email is required.'); isValid = false; }
    else if (!/\S+@\S+\.\S+/.test(pgOwnerEmail)) { setPgOwnerEmailError('Please enter a valid email address.'); isValid = false; }


    // Validate Address
    if (!address) { setAddressError('Address is required.'); isValid = false; }

    // Validate State
    if (!state) { setStateError('State is required.'); isValid = false; }

    // Validate Country
    if (!country) { setCountryError('Country is required.'); isValid = false; }

    // Validate Pincode
    if (!pincode) { setPincodeError('Pincode is required.'); isValid = false; }
    else if (!/^\d+$/.test(pincode)) { setPincodeError('Pincode can only contain digits.'); isValid = false; }

    // Validate Phone Number
    if (!pgOwnerPhoneNumber) { setPgOwnerPhoneNumberError('Phone Number is required.'); isValid = false; }
    else if (!/^\d+$/.test(pgOwnerPhoneNumber)) { setPgOwnerPhoneNumberError('Phone Number can only contain digits.'); isValid = false; }

    // Validate Photos
    if (photos.length < 3) { setPhotosError('Please upload a minimum of 3 photos.'); isValid = false; }
    else if (photos.length > 10) { setPhotosError('You can upload a maximum of 10 photos.'); isValid = false; }


    // Validate sharing options: if status is 'Available', price must be provided
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

    // Validate Facilities
    if (facilities.length === 0) { setFacilitiesError('Please select at least one facility/amenity.'); isValid = false; }


    if (!isValid) {
      setLoading(false);
      return;
    }

    if (!db || !userId) {
      setGeneralError("Application not ready. Please wait or refresh.");
      setLoading(false);
      return;
    }

    try {
      const pgDetailsToSave = {
        pgName,
        pgOwnerName,
        pgOwnerEmail, // Save the PG owner's email
        ownerId: userId, // Store the owner's UID
        address,
        state,
        country,
        pincode,
        pgOwnerPhoneNumber: `${countryCode}${pgOwnerPhoneNumber}`,
        locationLink,
        sharingOptions: activeSharingOptions,
        photos: photos.map(p => ({ url: p.url, caption: p.caption })), // Store photo URLs and captions
        facilities,
        status: 'pending', // Initial status
        createdAt: new Date(),
      };

      // Save to Firestore using the declared __app_id
      const docRef = await addDoc(collection(db, `artifacts/${__app_id}/public/data/pg_listings`), pgDetailsToSave);
      console.log("Document written with ID: ", docRef.id);

      alert(`PG details for "${pgName}" submitted for verification! An email will be sent to ${pgOwnerEmail} regarding the status.`);
      // Optionally clear form fields after successful submission
      setPgName('');
      setPgOwnerName('');
      setPgOwnerEmail('');
      setAddress('');
      setState('');
      setCountry('');
      setPincode('');
      setPgOwnerPhoneNumber('');
      setLocationLink('');
      setPhotos([]);
      setFacilities([]);
      setSharingOptions([
        { type: '1 Share', status: '', price: '' },
        { type: '2 Share', status: '', price: '' },
        { type: '3 Share', status: '', price: '' },
        { type: '4 Share', status: '', price: '' },
      ]);

    } catch (e) {
      console.error("Error adding document: ", e);
      setGeneralError("Failed to submit PG details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    // Navigate to a placeholder for viewing details, or implement a modal
    alert('View Details functionality will show submitted PG details.');
    // Example: navigate('/view-pg-details'); // You would pass data via state or query param
  };

  if (!isAuthReady) {
    return (
      <div className="pg-details-form-card">
        <p className="text-center">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="pg-details-form-card"> {/* Removed outer container and title/heading */}
      <div className="form-group-wrapper"> {/* Wrapper for form-group to control label/input layout */}
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

      <div className="form-group-inline-wrapper"> {/* New wrapper for inline group */}
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
            onChange={(e) => { setPincode(e.target.value.replace(/[^0-9]/g, '')); setPincodeError(''); }} // Allow only digits
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
          onClick={handleEdit}
          className="button button-outline"
          disabled={loading}
        >
          Edit
        </button>
        <button
          onClick={handleSendForValidation}
          className="button button-primary"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send for Validation'}
        </button>
        <button
          onClick={handleViewDetails}
          className="button button-secondary" // Added a new class for styling
          disabled={loading}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default PgOwnerDashboard;
