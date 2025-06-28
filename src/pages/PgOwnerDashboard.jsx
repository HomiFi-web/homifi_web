// src/pages/PgOwnerDashboard.jsx - Last updated: 2025-06-28 (JSX with embedded CSS for reliability and error fixes)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, setDoc, getDoc, orderBy, writeBatch, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Import lucide-react icons
import { User, LayoutDashboard, CheckSquare, Bell, Key, LogOut } from 'lucide-react';


// Logo is replaced with text for consistency and to avoid ERR_UNKNOWN_URL_SCHEME for contentFetchId
// In a production environment, 'homifiLogo' would be a public URL or a bundled asset.
// If you have a local image file (e.g., in src/assets), you would import it like:
// import homifiLogo from '../assets/logo.png'; // Assuming logo.png is in src/assets
// Then use it as <img src={homifiLogo} alt="Homifi Logo" className="homifi-logo" />

// Declare global variables for ESLint and provide fallback values
const __initial_auth_token = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : '';
const __app_id = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
// Fix: Add the declaration for __firebase_config here
const __firebase_config = typeof window !== 'undefined' && typeof window.__firebase_config !== 'undefined' ? window.__firebase_config : '{}';


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
  // Updated photos state to include 'blobUrl' for immediate local preview
  const [photos, setPhotos] = useState([]); // Stores { url: string, caption: string, blobUrl?: string }
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPgId, setCurrentPgId] = useState(null); // To store ID of PG being edited

  const [genderPreference, setGenderPreference] = useState(''); // 'male', 'female', 'unisex'

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [storage, setStorage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userListings, setUserListings] = useState([]);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('form'); // 'form' or 'listings'

  const [hoveredButton, setHoveredButton] = useState(null);

  // Notification states
  const [notifications, setNotifications] = useState([]); // Stores { id: string, message: string, read: boolean, timestamp: Date }
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);

  // Profile photo states - Removed profilePhotoUrl, profilePhotoLoading, profilePhotoError, profilePhotoInputRef


  // Message states for displaying feedback to the user
  const [message, setMessage] = useState('');
  const [messageType, setMessageType ] = useState(''); // 'success', 'error', 'info'

  const fileInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const formSectionRef = useRef(null); // Ref for the form section
  const notificationPopupRef = useRef(null); // Ref for the notification popup
  const messageBoxRef = useRef(null); // Ref for the app-message-box

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
  const [genderPreferenceError, setGenderPreferenceError] = useState('');

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

  // Renamed from displayedUserName to userName for clarity based on user request
  const [userName, setUserName] = useState('');


  // Function to display messages to the user
  const displayMessage = useCallback((text, type, duration = 5000) => {
    setMessage(text);
    setMessageType(type);
    if (type !== 'error') {
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, duration);
    }
  }, []);

  // Function to clear all form fields and errors
  const clearForm = useCallback(() => {
    console.log('clearForm called: Resetting form fields and errors.');

    setPgName('');
    setPgOwnerName('');
    setPgOwnerEmail('');
    setAddress('');
    setState('');
    setCountry('');
    setPincode('');
    setPgOwnerPhoneNumber('');
    setLocationLink('');
    // Revoke object URLs when clearing photos to prevent memory leaks
    photos.forEach(p => {
        if (p.blobUrl) URL.revokeObjectURL(p.blobUrl);
    });
    setPhotos([]);
    setFacilities([]);
    setSharingOptions([
      { type: '1 Share', status: '', price: '', hasMess: false },
      { type: '2 Share', status: '', price: '', hasMess: false },
      { type: '3 Share', status: '', price: '', hasMess: false },
      { type: '4 Share', status: '', price: '', hasMess: false },
    ]);
    setCurrentPgId(null);
    setGenderPreference('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      console.log('File input value cleared.');
    }

    // Clear all errors
    setPgNameError(''); setPgOwnerNameError(''); setPgOwnerEmailError(''); setAddressError('');
    setStateError(''); setCountryError(''); setPincodeError(''); setPgOwnerPhoneNumberError('');
    setPhotosError(''); setSharingOptionsError(''); setFacilitiesError(''); setGenderPreferenceError('');
    setMessage(''); setMessageType('');
  }, [photos]); // Added photos to dependency array for revokeObjectURL


  // Firebase Initialization and Auth
  useEffect(() => {
    try {
      // Firebase config must be parsed from the global string variable
      const firebaseConfig = JSON.parse(__firebase_config);
      // Ensure the correct storage bucket is explicitly set, as Firebase SDK might default to .appspot.com
      // even if the actual bucket is .firebasestorage.app. Your console screenshot confirms 'firebasestorage.app'
      // is the valid bucket.
      if (!firebaseConfig.storageBucket || firebaseConfig.storageBucket.includes('.appspot.com')) {
          firebaseConfig.storageBucket = 'homifi-4d283.firebasestorage.app'; // Force the correct bucket
      }
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      // Explicitly initialize getStorage with the desired bucket URL
      // This is crucial to ensure all storage operations target the correct bucket with CORS configured
      const storageBucketUrl = `gs://${firebaseConfig.storageBucket}`;
      const storageInstance = getStorage(app, storageBucketUrl);


      setAuth(authInstance);
      setDb(dbInstance);
      setStorage(storageInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          // Set userEmail to the authenticated user's email
          setUserEmail(user.email || 'Anonymous User');

          // No longer fetching profilePhotoUrl from Firestore, so simplify ownerDocSnap logic
          // and directly set userName to user.email
          setUserName(user.email || 'PG Owner');

        } else {
          if (__initial_auth_token) {
            await signInWithCustomToken(authInstance, __initial_auth_token);
          } else {
            await signInAnonymously(authInstance);
          }
          setUserName('PG Owner'); // Default for anonymous or not logged in
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      displayMessage(`Failed to initialize the application: ${error.message}. Please try again.`, 'error');
    }
  }, [displayMessage]);

  // Helper function to get the correct Firestore collection reference (private for user)
  const getPgListingsCollectionRef = useCallback((uid) => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    // Ensure db is not null before accessing collection
    if (!db) {
        console.error("Firestore database instance is not available.");
        return null;
    }
    return collection(db, `artifacts/${appId}/users/${uid}/pg_listings`);
  }, [db]); // Depend on db instance

  // Helper function to get the correct Firestore notifications collection reference
  const getNotificationsCollectionRef = useCallback((uid) => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    if (!db) {
        console.error("Firestore database instance is not available for notifications.");
        return null;
    }
    return collection(db, `artifacts/${appId}/users/${uid}/notifications`);
  }, [db]);

  // Helper function to get the public collection for admin verifications
  const getAdminVerificationCollectionRef = useCallback(() => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    if (!db) {
        console.error("Firestore database instance is not available for admin verifications.");
        return null;
    }
    return collection(db, `artifacts/${appId}/public/data/admin_pending_pg_verifications`);
  }, [db]);


  // Function to add a notification to Firestore
  const addNotificationToFirestore = useCallback(async (pgId, message, statusType) => {
      if (!db || !userId) {
          console.error("Firestore or User ID not available for adding notification.");
          return;
      }
      try {
          const notificationsCollectionRef = getNotificationsCollectionRef(userId);
          if (!notificationsCollectionRef) return;

          // Check if a similar notification already exists to prevent duplicates
          // For 'submitted' type, allow new ones if the PG was updated
          // For 'accepted' or 'rejected', only add if it's a new status change
          const q = query(
              notificationsCollectionRef,
              where('pgId', '==', pgId),
              where('statusType', '==', statusType)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              console.log(`Skipping duplicate notification for PG ${pgId} with statusType ${statusType}.`);
              return;
          }

          await addDoc(notificationsCollectionRef, {
              pgId,
              message,
              statusType, // 'submission', 'accepted', 'rejected'
              read: false,
              timestamp: new Date(),
          });
          console.log("Notification added to Firestore.");
      } catch (error) {
          console.error("Error adding notification to Firestore:", error);
      }
  }, [db, userId, getNotificationsCollectionRef]);


  // Function to mark a notification as read in Firestore
  const markNotificationAsReadInFirestore = useCallback(async (notificationId) => {
      if (!db || !userId) return;
      try {
          const notificationDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/notifications`, notificationId);
          await updateDoc(notificationDocRef, { read: true });
          console.log("Notification marked as read in Firestore.");
      } catch (error) {
          console.error("Error marking notification as read:", error);
      }
  }, [db, userId]);

  // Function to clear all notifications from Firestore
  const clearAllNotificationsFromFirestore = useCallback(async () => {
      if (!db || !userId) return;
      try {
          const notificationsCollectionRef = getNotificationsCollectionRef(userId);
          if (!notificationsCollectionRef) return;

          const q = query(notificationsCollectionRef);
          const querySnapshot = await getDocs(q);
          const batch = writeBatch(db); // Use batch for multiple deletes
          querySnapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
          });
          await batch.commit();
          console.log("All notifications cleared from Firestore.");
      } catch (error) {
          console.error("Error clearing notifications:", error);
      }
  }, [db, userId, getNotificationsCollectionRef]);

  // Fetch user-specific listings when userId or db changes
  useEffect(() => {
    const fetchUserListings = async () => {
      const collectionRef = getPgListingsCollectionRef(userId);
      if (db && userId && collectionRef) {
        try {
          const q = query(collectionRef, where('ownerId', '==', userId));
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
  }, [db, userId, isAuthReady, displayMessage, getPgListingsCollectionRef]);

  // Effect to listen for real-time notifications from Firestore
  useEffect(() => {
      if (!db || !userId) return;

      const notificationsCollectionRef = getNotificationsCollectionRef(userId);
      if (!notificationsCollectionRef) return;

      const q = query(notificationsCollectionRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedNotifications = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              // Convert Firestore Timestamp to JS Date object
              timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date(),
          }));
          setNotifications(fetchedNotifications);
          console.log("Real-time notifications fetched:", fetchedNotifications);
      }, (error) => {
          console.error("Error fetching real-time notifications:", error);
      });

      return () => unsubscribe(); // Cleanup listener on unmount
  }, [db, userId, getNotificationsCollectionRef]);

  // Effect to check PG listing status changes and create notifications (Admin Simulation)
  useEffect(() => {
      if (!db || !userId || !userListings.length || !notifications.length) return; // Wait for listings and notifications to load

      userListings.forEach(listing => {
          // Check for 'accepted' status
          const acceptedNotificationExists = notifications.some(
              n => n.pgId === listing.id && n.statusType === 'accepted'
          );
          if (listing.status === 'accepted' && !acceptedNotificationExists) {
              addNotificationToFirestore(
                  listing.id,
                  `Great news! Your PG '${listing.pgName}' has been Accepted!`,
                  'accepted'
              );
          }

          // Check for 'rejected' status
          const rejectedNotificationExists = notifications.some(
              n => n.pgId === listing.id && n.statusType === 'rejected'
          );
          if (listing.status === 'rejected' && !rejectedNotificationExists) {
              addNotificationToFirestore(
                  listing.id,
                  `Unfortunately, your PG '${listing.pgName}' has been Rejected. Please review and resubmit.`,
                  'rejected'
              );
          }
      });
  }, [userListings, notifications, addNotificationToFirestore, db, userId]);


  // Handle changes for status or price of a specific sharing option
  const handleSharingOptionChange = (index, field, value) => {
    const newSharingOptions = [...sharingOptions];
    newSharingOptions[index][field] = (field === 'hasMess') ? value : value;
    setSharingOptions(newSharingOptions);
    setSharingOptionsError('');
  };

  const handleGenderChange = (e) => {
    setGenderPreference(e.target.value);
    setGenderPreferenceError('');
  };

  // Modified handlePhotoUpload to use Firebase Storage and create local blob URLs
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

      setLoading(true);
      let uploadedCount = 0;
      const newPhotoEntries = [];

      try {
        for (const file of validFiles) {
          const storagePath = `pg_images/${userId}/${Date.now()}_${file.name}`;
          const imageRef = ref(storage, storagePath);
          await uploadBytes(imageRef, file);
          // Modification Start: Construct the URL to use firebasestorage.app
          // This ensures the URL matches the bucket you successfully configured CORS on
          // The bucket name is now ensured to be correct by firebaseConfig.storageBucket
          const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(storagePath)}?alt=media`;
          // Modification End

          // Create a temporary object URL for immediate local display
          const blobUrl = URL.createObjectURL(file);
          newPhotoEntries.push({ url: downloadURL, caption: '', blobUrl: blobUrl }); // Store both URLs
          uploadedCount++;
          setPhotoUploadProgress(Math.floor((uploadedCount / validFiles.length) * 100));
        }
        setPhotos(prevPhotos => [...prevPhotos, ...newPhotoEntries]);
        displayMessage("Photos uploaded successfully!", 'success', 3000);
        setPhotoUploadProgress(0);
      } catch (error) {
        console.error("Error uploading photos:", error);
        displayMessage(`Failed to upload photos: ${error.message}. Please check your Firebase Storage CORS policy and Firebase Storage Rules.`, 'error');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // Ensure blob URLs are revoked when component unmounts or photos change
  useEffect(() => {
    return () => {
      photos.forEach(p => {
        if (p.blobUrl) URL.revokeObjectURL(p.blobUrl);
      });
    };
  }, [photos]);


  const handlePhotoCaptionChange = (index, caption) => {
    const newPhotos = [...photos];
    newPhotos[index].caption = caption;
    setPhotos(newPhotos);
  };

  const handleRemovePhoto = (indexToRemove) => {
    setPhotos((prevPhotos) => {
      const photoToRemove = prevPhotos[indexToRemove];
      if (photoToRemove && photoToRemove.blobUrl) {
        URL.revokeObjectURL(photoToRemove.blobUrl); // Revoke the blob URL
      }
      const newPhotos = prevPhotos.filter((_, i) => i !== indexToRemove);
      setPhotosError('');
      displayMessage("Photo removed.", 'info', 2000);
      // If newPhotos become empty, also clear the file input
      if (newPhotos.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return newPhotos;
    });
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
    setGenderPreference(listing.genderPreference || '');
    const storedPhoneNumber = listing.pgOwnerPhoneNumber || '';
    const codeMatch = storedPhoneNumber.match(/^\+(\d+)/);
    if (codeMatch) {
      setCountryCode(codeMatch[0]);
      setPgOwnerPhoneNumber(storedPhoneNumber.substring(codeMatch[0].length));
    } else {
      setCountryCode('+91');
      setPgOwnerPhoneNumber(storedPhoneNumber);
    }
    setLocationLink(listing.locationLink || '');
    // Modification Start: Ensure photos loaded from Firestore use the firebasestorage.app domain
    setPhotos(listing.photos ? listing.photos.map(p => {
        // If the URL from Firestore still uses .appspot.com, try to convert it.
        // This is a defensive measure in case old data exists or getDownloadURL behavior changes.
        if (p.url && storage && storage.app && storage.app.options.storageBucket && p.url.includes('.appspot.com')) {
            const path = p.url.split('/o/')[1].split('?')[0]; // Extract the path after /o/ and before ?
            return {
                url: `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${path}?alt=media`,
                caption: p.caption || ''
            };
        }
        return { url: p.url, caption: p.caption || '' };
    }) : []);
    // Modification End

    setFacilities(listing.facilities || []);

    const updatedSharingOptions = sharingOptions.map(optionType => {
        const found = (listing.sharingOptions || []).find(so => so.type === optionType.type);
        return found ? { ...found } : { type: optionType.type, status: '', price: '', hasMess: false };
    });
    setSharingOptions(updatedSharingOptions);
    setCurrentPgId(listing.id);
    setActiveSection('form'); // When loading for edit, always show the form

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setPgNameError(''); setPgOwnerNameError(''); setPgOwnerEmailError(''); setAddressError('');
    setStateError(''); setCountryError(''); setPincodeError(''); setPgOwnerPhoneNumberError('');
    setPhotosError(''); setSharingOptionsError(''); setFacilitiesError(''); setGenderPreferenceError('');
    setMessage(''); setMessageType('');
    displayMessage(`Editing listing: "${listing.pgName}"`, 'info', 3000);
  }, [sharingOptions, displayMessage, storage]); // Added storage to dependencies

  const handleSendForValidation = async () => {
    setLoading(true);
    // Clear all previous errors and messages before validation
    setPgNameError(''); setPgOwnerNameError(''); setPgOwnerEmailError(''); setAddressError('');
    setStateError(''); setCountryError(''); setPincodeError(''); setPgOwnerPhoneNumberError('');
    setPhotosError(''); setSharingOptionsError(''); setFacilitiesError('');
    setMessage(''); setMessageType(''); setGenderPreferenceError('');

    let isValid = true;

    if (!pgName) { setPgNameError('PG Name is required.'); isValid = false; }
    else if (!/^[a-zA-Z\s]+$/.test(pgName)) { setPgNameError('PG Name can only contain alphabets and spaces.'); isValid = false; }

    if (!pgOwnerName) { setPgOwnerNameError('PG Owner Name is required.'); isValid = false; }
    else if (!/^[a-zA-Z\s]+$/.test(pgOwnerName)) { setPgOwnerNameError('PG Owner Name can only contain alphabets and spaces.'); isValid = false; }

    if (!pgOwnerEmail) { setPgOwnerEmailError('PG Owner Email is required.'); isValid = false; }
    else if (!/\S+@\S+\.\S+/.test(pgOwnerEmail)) { setPgOwnerEmailError('Please enter a valid email address.'); isValid = false; }

    if (!genderPreference) { setGenderPreferenceError('Please select PG gender preference.'); isValid = false; }

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

    // Ensure db and userId are available before proceeding with Firestore operations
    const collectionRef = getPgListingsCollectionRef(userId);
    const adminVerificationCollectionRef = getAdminVerificationCollectionRef();
    if (!db || !userId || !collectionRef || !adminVerificationCollectionRef) {
      displayMessage("Application not ready for submission. Please wait for Firebase to initialize and user to authenticate.", 'error');
      setLoading(false);
      return;
    }

    try {
      const fullPhoneNumber = `${countryCode}${pgOwnerPhoneNumber}`;

      const pgDetailsToSave = {
        pgName, pgOwnerName, pgOwnerEmail, ownerId: userId, genderPreference,
        address, state, country, pincode, pgOwnerPhoneNumber: fullPhoneNumber,
        locationLink,
        // Ensure photos saved to Firestore use the firebasestorage.app domain
        photos: photos.map(p => {
          // If the URL created by getDownloadURL (which uses .appspot.com)
          // is being used, convert it to the .firebasestorage.app format before saving.
          if (p.url && storage && storage.app && storage.app.options.storageBucket && p.url.includes('.appspot.com')) {
              const path = p.url.split('/o/')[1].split('?')[0];
              return {
                  url: `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${path}?alt=media`,
                  caption: p.caption || ''
              };
          }
          return { url: p.url, caption: p.caption || '' };
        }),
        facilities,
        sharingOptions: activeSharingOptions,
        status: currentPgId ? (userListings.find(l => l.id === currentPgId)?.status || 'pending') : 'pending', // Keep existing status if editing, else 'pending'
        createdAt: new Date(),
      };

      const ownerDetailsToSave = {
        // We save the pgOwnerName here, but the welcome message will use the login email.
        userName: pgOwnerName, // This stores the name entered in the form.
        email: pgOwnerEmail,
        phone: fullPhoneNumber,
        // profilePhotoUrl: profilePhotoUrl // Removed profilePhotoUrl from ownerDetailsToSave
      };
      await setDoc(doc(db, 'artifacts', __app_id, 'users', userId, 'pg_owners', userId), ownerDetailsToSave, { merge: true });
      console.log("Owner details saved/updated for userId: ", userId);
      // IMPORTANT: DO NOT setUserName(pgOwnerName) here.
      // The userName state for display should remain user.email as per user request.


      let newOrUpdatedPgId = currentPgId;
      if (currentPgId) {
        await updateDoc(doc(collectionRef, currentPgId), pgDetailsToSave);
        console.log("Document updated with ID: ", currentPgId);
        displayMessage(`PG details for "${pgName}" updated successfully!`, 'success');
        // If status was already accepted/rejected, no new notification needed.
        // If it was 'pending' and now 'pending' (after update), still notify submission.
        const oldStatus = userListings.find(l => l.id === currentPgId)?.status;
        if (oldStatus !== 'accepted' && oldStatus !== 'rejected') { // Only add submission notification if not already verified
             await addNotificationToFirestore(currentPgId, `Your PG '${pgName}' details have been updated and are pending re-validation.`, 'submission');
        }
        // Update the admin pending verification document as well
        await setDoc(doc(adminVerificationCollectionRef, currentPgId), {
            ...pgDetailsToSave,
            pgListingId: currentPgId // Store a reference to the actual PG listing ID
        }, { merge: true });
        console.log("Admin verification document updated with ID: ", currentPgId);

      } else {
        const docRef = await addDoc(collectionRef, pgDetailsToSave);
        newOrUpdatedPgId = docRef.id;
        console.log("Document written with ID: ", docRef.id);
        displayMessage(`PG details for "${pgName}" submitted for verification! An email will be sent to ${pgOwnerEmail} regarding the status.`, 'success');
        await addNotificationToFirestore(newOrUpdatedPgId, `Your PG '${pgName}' has been submitted for validation.`, 'submission');

        // Add to admin pending verification collection
        await setDoc(doc(adminVerificationCollectionRef, newOrUpdatedPgId), {
            ...pgDetailsToSave,
            pgListingId: newOrUpdatedPgId // Store a reference to the actual PG listing ID
        });
        console.log("Admin verification document created with ID: ", newOrUpdatedPgId);
      }

      clearForm();

      // Re-fetch listings to update the displayed list
      const q = query(collectionRef, where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserListings(listings);
      setActiveSection('listings'); // Automatically switch to listings view after submission/update

    } catch (e) {
      console.error("Error adding/updating document: ", e);
      displayMessage(`Failed to submit PG details: ${e.message}. Please check your Firebase rules and network connection.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnotherBuilding = () => {
    console.log('Add Another Building button clicked. Current loading state:', loading);
    clearForm();
    displayMessage('Form cleared. Ready to add a new building.', 'info', 3000);
    console.log('Form reset initiated by Add Another Building button.');
    setActiveSection('form'); // Switch to form when adding a new building
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        setUserId(null);
        setUserEmail('');
        setUserListings([]);
        setUserName('PG Owner'); // Reset username on logout
        // setProfilePhotoUrl(''); // Removed clear profile photo on logout
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

  const toggleSidebar = () => {
    setIsSidebarOpen(prevState => !prevState);
  };

  // New function to handle Dashboard click
  const handleDashboardClick = () => {
    setActiveSection('form'); // Set active section to form
    setIsSidebarOpen(false); // Close sidebar after clicking
    displayMessage('Displaying PG Property Details form.', 'info', 2000);
  };

  // New function to handle View Status click
  const handleViewStatusClick = () => {
    setActiveSection('listings'); // Set active section to listings
    setIsSidebarOpen(false); // Close sidebar after clicking
    displayMessage('Displaying your existing PG listings.', 'info', 2000);
  };

  // Updated handleViewNotifications to show the notification popup
  const handleViewNotifications = () => {
    setShowNotificationsPopup(true);
    setIsSidebarOpen(false); // Close sidebar after clicking
  };

  // Mark notification as read (calls Firestore function)
  const markNotificationAsRead = (id) => {
    markNotificationAsReadInFirestore(id);
  };

  // Clear all notifications (calls Firestore function)
  const clearAllNotifications = () => {
    clearAllNotificationsFromFirestore();
  };

  // Close notification popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationPopupRef.current && !notificationPopupRef.current.contains(event.target) && showNotificationsPopup) {
        setShowNotificationsPopup(false);
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      // Close message box if clicked outside
      if (messageBoxRef.current && !messageBoxRef.current.contains(event.target) && message) {
        setMessage('');
        setMessageType('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationsPopup, isSidebarOpen, message]); // Add message to dependencies


  if (!isAuthReady) {
    return (
      <div className="loading-container">
        <p className="text-center">Loading application...</p>
      </div>
    );
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="pg-owner-dashboard-wrapper">
      <style>{`
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

            --text-dark: #34495e; /* Darker grey for primary text */
            --text-medium: #7f8c8d; /* Muted grey for secondary text */
            --text-light: #bdc3c7; /* Lighter grey for hints */
            --border-light: #dfe4ea; /* Softer border color */
            --border-subtle: #f1f2f6; /* Very subtle border */

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
            min-height: 100vh;
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

        /* Removed profile-photo-container, profile-photo, profile-photo-placeholder, profile-photo-upload-button */
        /* Removed profile-upload-loading, profile-upload-error */


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

        .sidebar-button:hover {
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

        .sidebar-button:hover svg {
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
            margin: 2.5rem auto;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
            /* Added for centering on larger screens */
            align-items: center; /* Center children horizontally */
            justify-content: center; /* Center children vertically if content is short */
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


        /* PG Details Form Card */
        .pg-details-form-card,
        .owner-listings-section {
            background-color: var(--bg-card);
            color: var(--text-dark);
            padding: 2.5rem; /* Increased padding */
            border-radius: var(--border-radius-large);
            box-shadow: var(--shadow-lg); /* More prominent shadow for cards */
            width: 100%; /* Ensure it takes full width within its parent */
            max-width: 800px; /* Limit max-width for better readability on large screens */
            box-sizing: border-box; /* Include padding in width calculation */
            margin: 0 auto; /* Center the card itself */
        }

        .form-title,
        .section-title {
            font-size: 2rem; /* Larger titles */
            color: var(--homifi-dark-blue);
            margin-bottom: 2rem; /* Increased margin */
            text-align: center;
            font-weight: 700;
        }

        .form-group-wrapper {
            margin-bottom: 1.5rem;
        }

        .form-group {
            margin-bottom: 0.6rem;
        }

        .form-label {
            display: block;
            margin-bottom: 0.6rem;
            font-weight: 600;
            color: var(--text-dark);
            font-size: 1rem;
        }

        .required-field {
            color: var(--error-red);
            margin-left: 0.25rem;
        }

        .form-input,
        .form-textarea,
        .form-select {
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

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
            border-color: var(--homifi-teal);
            box-shadow: 0 0 0 4px rgba(45, 202, 181, 0.25);
            outline: none;
        }

        .form-textarea {
            resize: vertical;
            min-height: 120px;
        }

        .field-error-message {
            color: var(--error-red);
            font-size: 0.88rem;
            margin-top: 0.3rem;
            margin-left: 0.3rem;
            font-weight: 500;
        }

        /* Inline Form Groups */
        .form-group-inline-wrapper {
            display: flex;
            gap: 1.8rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
        }

        .form-group-half-wrapper {
            flex: 1;
            min-width: calc(50% - 0.9rem);
        }

        /* Phone Input Group */
        .phone-input-group {
            display: flex;
            gap: 0.6rem;
        }

        .country-code-select {
            flex-basis: 110px;
            flex-shrink: 0;
        }

        .phone-number-input {
            flex-grow: 1;
        }

        /* Gender Preference Radio Group */
        .gender-preference-radio-group {
            display: flex;
            gap: 1.8rem;
            margin-top: 0.6rem;
            flex-wrap: wrap;
        }

        .gender-preference-radio-group label {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            cursor: pointer;
            font-weight: 500;
            color: var(--text-dark);
            font-size: 1rem;
        }

        .gender-preference-radio-group input[type="radio"] {
            appearance: none;
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border: 2px solid var(--homifi-teal);
            border-radius: 50%;
            outline: none;
            cursor: pointer;
            display: inline-block;
            position: relative;
            transition: all 0.2s ease;
        }

        .gender-preference-radio-group input[type="radio"]:checked {
            background-color: var(--homifi-teal);
            border-color: var(--homifi-teal);
            box-shadow: 0 0 0 3px rgba(45, 202, 181, 0.3);
        }

        .gender-preference-radio-group input[type="radio"]:checked::before {
            content: '';
            width: 10px;
            height: 10px;
            background-color: var(--bg-white);
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        /* Photo Upload and Preview */
        .photo-preview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1.2rem;
            margin-top: 1.2rem;
            background-color: var(--bg-light-grey);
            padding: 1.2rem;
            border-radius: var(--border-radius-medium);
            border: 1px solid var(--border-light);
        }

        .photo-preview-item {
            position: relative;
            border: 1px solid var(--border-subtle);
            border-radius: var(--border-radius-small);
            padding: 0.6rem;
            background-color: var(--bg-white);
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .photo-preview-item:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-md);
        }

        .photo-preview-image {
            width: 100%;
            height: 110px;
            object-fit: cover;
            border-radius: var(--border-radius-small);
            margin-bottom: 0.6rem;
        }

        .photo-caption-input {
            width: calc(100% - 12px);
            padding: 0.35rem;
            border: 1px solid var(--border-light);
            border-radius: var(--border-radius-small);
            font-size: 0.85rem;
            resize: vertical;
            margin-bottom: 0.6rem;
        }

        .remove-photo-button {
            position: absolute;
            top: 8px;
            right: 8px;
            background-color: var(--error-red);
            color: white;
            border: none;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 1.3rem;
            cursor: pointer;
            opacity: 0.9;
            transition: opacity 0.2s, transform 0.2s;
            line-height: 1;
            padding: 0;
        }

        .remove-photo-button:hover {
            opacity: 1;
            transform: scale(1.1);
        }

        .loading-message {
            font-size: 0.95rem;
            color: var(--homifi-dark-blue);
            margin-top: 0.75rem;
            text-align: center;
            font-weight: 500;
        }

        /* Sharing Options Grid */
        .sharing-options-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.2rem;
            margin-top: 0.8rem;
            background-color: var(--bg-soft-blue);
            padding: 1.2rem;
            border-radius: var(--border-radius-medium);
            border: 1px solid var(--border-subtle);
        }

        .sharing-option-item {
            background-color: var(--bg-white);
            padding: 1.2rem;
            border-radius: var(--border-radius-small);
            border: 1px solid var(--border-light);
            box-shadow: var(--shadow-sm);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .sharing-option-item:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        .sharing-details-stack {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
        }

        .sharing-option-label {
            font-weight: 600;
            color: var(--homifi-dark-blue);
            font-size: 1rem;
            margin-bottom: 0.3rem;
        }

        .sharing-status-select,
        .sharing-price-input {
            padding: 0.6rem 0.8rem;
            font-size: 0.95rem;
            border-radius: var(--border-radius-small);
        }

        .price-input-wrapper {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        .rupee-symbol {
            font-size: 1.2rem;
            font-weight: bold;
            color: var(--text-medium);
        }

        .mess-checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            font-size: 0.95rem;
            color: var(--text-dark);
            margin-top: 0.6rem;
            cursor: pointer;
        }

        /* Amenities and Services */
        .amenities-section {
            margin-top: 2rem;
        }

        .amenities-section h4 {
            font-size: 1.35rem;
            color: var(--homifi-dark-blue);
            margin-bottom: 1.2rem;
            border-bottom: 3px solid var(--homifi-teal);
            padding-bottom: 0.6rem;
            font-weight: 700;
        }

        .amenities-checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 0.8rem;
            margin-bottom: 1.8rem;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            background-color: var(--bg-light-grey);
            padding: 0.85rem 1.1rem;
            border-radius: var(--border-radius-medium);
            border: 1px solid var(--border-light);
            cursor: pointer;
            transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
            box-shadow: var(--shadow-sm);
        }

        .checkbox-item:hover {
            background-color: #e6e6e6;
            border-color: var(--homifi-cyan);
            box-shadow: var(--shadow-md);
        }

        .checkbox-item input[type="checkbox"] {
            appearance: none;
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border: 2px solid var(--homifi-teal);
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: background-color 0.2s, border-color 0.2s;
        }

        .checkbox-item input[type="checkbox"]:checked {
            background-color: var(--homifi-teal);
            border-color: var(--homifi-teal);
        }

        .checkbox-item input[type="checkbox"]:checked::before {
            content: '✔';
            color: white;
            font-size: 13px;
        }

        .checkbox-item label {
            font-size: 0.95rem;
            color: var(--text-dark);
            cursor: pointer;
            margin-bottom: 0;
        }

        /* Form Actions */
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1.2rem;
            margin-top: 2.5rem;
            flex-wrap: wrap;
        }

        .button {
            padding: 0.9rem 1.8rem;
            border: none;
            border-radius: var(--border-radius-medium);
            cursor: pointer;
            font-size: 1.05rem;
            font-weight: 600;
            transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
            text-align: center;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.6rem;
        }

        .button-primary {
            background-color: var(--homifi-teal);
            color: var(--homifi-dark-blue);
            box-shadow: 0 5px 15px rgba(45, 202, 181, 0.25);
        }

        .button-primary:hover {
            background-color: #27c2b6;
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(45, 202, 181, 0.35);
        }

        .button-secondary {
            background-color: var(--homifi-cyan);
            color: var(--homifi-dark-blue);
            box-shadow: 0 5px 15px rgba(0, 177, 196, 0.25);
        }

        .button-secondary:hover {
            background-color: #00afc5;
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 177, 196, 0.35);
        }

        .button-outline {
            background-color: transparent;
            border: 2px solid var(--homifi-teal);
            color: var(--homifi-teal);
            box-shadow: inset 0 0 0 0 transparent;
        }

        .button-outline:hover {
            background-color: var(--homifi-teal);
            color: var(--homifi-dark-blue);
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(45, 202, 181, 0.2);
        }

        .button-small {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
        }

        .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }


        /* Owner Listings Section */
        .owner-listings-section {
            margin-top: 2.5rem;
        }

        .listings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.8rem;
            margin-top: 1.8rem;
        }

        .listing-card {
            background-color: var(--bg-card);
            padding: 1.8rem;
            border-radius: var(--border-radius-medium);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border-light);
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .listing-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-lg);
        }

        .listing-card h3 {
            color: var(--homifi-dark-blue);
            margin-top: 0;
            margin-bottom: 0.6rem;
            font-size: 1.4rem;
            font-weight: 600;
        }

        .listing-card p {
            margin: 0;
            color: var(--text-medium);
            font-size: 0.95rem;
        }

        .listing-card .button {
            align-self: flex-start;
            margin-top: 1rem;
            padding: 0.6rem 1.2rem;
            font-size: 0.9rem;
        }

        /* Notification Popup Styles */
        .notification-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1200;
            animation: fadeIn 0.3s ease-out;
        }

        .notification-popup {
            background-color: var(--bg-white);
            color: var(--text-dark);
            padding: 2rem;
            border-radius: var(--border-radius-large);
            box-shadow: var(--shadow-lg);
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            animation: slideInFromTop 0.3s ease-out;
            display: flex;
            flex-direction: column;
        }

        .notification-popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid var(--border-light);
            padding-bottom: 1rem;
        }

        .notification-popup-header h3 {
            margin: 0;
            font-size: 1.8rem;
            color: var(--homifi-dark-blue);
            font-weight: 700;
        }

        .notification-popup-close-button {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: var(--text-medium);
            transition: color 0.2s ease, transform 0.2s ease;
        }

        .notification-popup-close-button:hover {
            color: var(--error-red);
            transform: rotate(90deg);
        }

        .notification-list {
            list-style: none;
            padding: 0;
            margin: 0;
            flex-grow: 1;
        }

        .notification-item {
            background-color: var(--bg-light-grey);
            border: 1px solid var(--border-subtle);
            border-radius: var(--border-radius-medium);
            padding: 1rem 1.2rem;
            margin-bottom: 0.8rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            position: relative;
            box-shadow: var(--shadow-sm);
            transition: background-color 0.2s ease;
        }

        .notification-item.unread {
            background-color: #fff3e0; /* Light orange for unread */
            border-left: 5px solid var(--homifi-teal);
            font-weight: 600;
        }

        .notification-item-message {
            font-size: 0.95rem;
            color: var(--text-dark);
            flex-grow: 1;
        }

        .notification-item-timestamp {
            font-size: 0.8rem;
            color: var(--text-medium);
            align-self: flex-end;
        }

        .notification-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.8rem;
            margin-top: 1.5rem;
            border-top: 1px solid var(--border-light);
            padding-top: 1rem;
        }

        .notification-action-button {
            padding: 0.6rem 1.2rem;
            border-radius: var(--border-radius-medium);
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid transparent;
        }

        .notification-action-button.primary {
            background-color: var(--homifi-teal);
            color: var(--homifi-dark-blue);
        }

        .notification-action-button.primary:hover {
            background-color: #27c2b6;
        }

        .notification-action-button.secondary {
            background-color: var(--bg-light-grey);
            color: var(--text-dark);
            border-color: var(--border-light);
        }

        .notification-action-button.secondary:hover {
            background-color: #e6e6e6;
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
            .top-nav-logo {
                height: 32px;
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

            .form-group-inline-wrapper {
                flex-direction: column;
                gap: 1rem;
            }

            .form-group-half-wrapper {
                min-width: unset;
                width: 100%;
            }

            .sharing-options-grid,
            .amenities-checkbox-grid,
            .listings-grid {
                grid-template-columns: 1fr;
            }

            .form-actions {
                flex-direction: column;
                gap: 0.8rem;
            }

            .button {
                width: 100%;
                padding: 0.8rem 1.5rem;
                font-size: 1rem;
            }

            .gender-preference-radio-group {
                flex-direction: column;
                gap: 12px;
            }
            .pg-details-form-card,
            .owner-listings-section {
                padding: 2rem;
            }
            .notification-popup {
                padding: 1.5rem;
            }
            .notification-popup-header h3 {
                font-size: 1.5rem;
            }
            .notification-popup-close-button {
                font-size: 1.8rem;
            }
        }

        @media (max-width: 768px) {
            .pg-details-form-card,
            .owner-listings-section {
                padding: 1.5rem;
            }

            .form-title,
            .section-title {
                font-size: 1.6rem;
                margin-bottom: 1.2rem;
            }
            .photo-preview-grid {
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 0.6rem;
                padding: 0.6rem;
            }
            .photo-preview-image {
                height: 70px;
            }
            .photo-caption-input {
                font-size: 0.7rem;
            }
            .remove-photo-button {
                width: 22px;
                height: 22px;
                font-size: 1.1rem;
                top: 6px;
                right: 6px;
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
            .notification-popup {
                width: 95%;
                padding: 1.2rem;
            }
            .notification-popup-header h3 {
                font-size: 1.3rem;
            }
            .notification-action-button {
                padding: 0.5rem 1rem;
                font-size: 0.85rem;
            }
        }

        @media (max-width: 480px) {
            .top-nav-bar {
                padding: 0.4rem 0.75rem;
            }
            .top-nav-logo {
                height: 28px;
            }
            .pg-details-form-card,
            .owner-listings-section {
                padding: 1rem;
            }
            .form-title,
            .section-title {
                font-size: 1.25rem;
            }
            .photo-preview-grid {
                grid-template-columns: 1fr;
                gap: 0.8rem;
                padding: 0.5rem;
            }
            .photo-preview-image {
                height: 100px;
            }
            .form-actions .button {
                padding: 0.7rem 1rem;
                font-size: 0.9rem;
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
      `}</style>
      {/* Top Navigation Bar */}
      <nav className="top-nav-bar">
        <div className="top-nav-left">
          {/* Replaced image logo with text "HomiFi" to avoid ERR_UNKNOWN_URL_SCHEME */}
          <span className="homifi-logo-text">HomiFi</span>
        </div>
        <div className="top-nav-right">
          <ul className="top-nav-menu">
            <li className="top-nav-menu-item profile-menu-item" onClick={toggleSidebar}>
              <User size={24} /> {/* Replaced Feather icon with Lucide icon */}
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
          {/* Profile photo section has been removed */}

          <p className="sidebar-user-email">Welcome, {userName || 'PG Owner'}</p>

          {/* Dashboard Button */}
          <button
            onClick={handleDashboardClick}
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('dashboard')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <LayoutDashboard size={20} />
            <span>{hoveredButton === 'dashboard' ? 'Go to Dashboard' : 'Dashboard'}</span>
          </button>

          {/* View Status Button */}
          <button
            onClick={handleViewStatusClick}
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('status')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <CheckSquare size={20} />
            <span>{hoveredButton === 'status' ? 'Check Status' : 'View Status'}</span>
          </button>

          {/* View Notifications Button */}
          <button
            onClick={handleViewNotifications}
            className="sidebar-button"
            onMouseEnter={() => setHoveredButton('notifications')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{ position: 'relative' }} // Added for badge positioning
          >
            <Bell size={20} />
            <span>{hoveredButton === 'notifications' ? 'See Alerts' : 'View Notifications'}</span>
            {unreadNotificationsCount > 0 && (
                <span className="notification-badge">{unreadNotificationsCount}</span>
            )}
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
        {message && (
          <div className="message-popup-overlay">
            <div ref={messageBoxRef} className={`app-message-box ${messageType}`}>
              <p>{message}</p>
              <button className="app-message-box-close-button" onClick={() => setMessage('')}>OK</button>
            </div>
          </div>
        )}

        {/* Conditionally render the form or the listings based on activeSection state */}
        {activeSection === 'form' && (
          <div ref={formSectionRef} className="pg-details-form-card">
            <h2 className="form-title">{currentPgId ? 'Edit PG Property Details' : 'Add New PG Property Details'}</h2>

            {/* Gender Preference */}
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
                    // Use photo.blobUrl for immediate preview, fallback to photo.url if from Firestore
                    <div key={photo.url || index} className="photo-preview-item">
                      <img
                        src={photo.blobUrl || photo.url}
                        alt={photo.caption || `Uploaded ${index + 1}`}
                        className="photo-preview-image"
                        // Add onError to handle CORS blocked images from Firebase after refresh
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/110x110/f0f2f5/7f8c8d?text=Image+Load+Error"; }}
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
                        {/* Only show price input if status is 'Available' */}
                        {option.status === 'Available' && (
                          <div className="price-input-wrapper">
                            <span className="rupee-symbol">₹</span>
                            <input
                              type="number"
                              value={option.price}
                              onChange={(e) => handleSharingOptionChange(optionIndex, 'price', e.target.value)}
                              placeholder="Price"
                              className="form-input sharing-price-input"
                            />
                          </div>
                        )}
                        {/* New: Mess Option */}
                        <label className="mess-checkbox-label">
                            <input
                                type="checkbox"
                                checked={option.hasMess}
                                onChange={(e) => handleSharingOptionChange(optionIndex, 'hasMess', e.target.checked)}
                                disabled={option.status === 'Full'}
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
        )}

        {/* Conditionally render the listings section */}
        {activeSection === 'listings' && userListings.length > 0 && (
          <div id="owner-listings-section" className="owner-listings-section">
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

        {activeSection === 'listings' && userListings.length === 0 && (
            <div className="owner-listings-section">
                <h2 className="section-title">Your Existing PG Listings</h2>
                <p className="text-center">No PG listings found. Click "Dashboard" to add a new PG property.</p>
            </div>
        )}
      </div>

      {/* Notification Popup Modal */}
      {showNotificationsPopup && (
        <div className="notification-popup-overlay">
          <div ref={notificationPopupRef} className="notification-popup">
            <div className="notification-popup-header">
              <h3>Notifications</h3>
              <button className="notification-popup-close-button" onClick={() => setShowNotificationsPopup(false)}>
                &times;
              </button>
            </div>
            {notifications.length > 0 ? (
              <ul className="notification-list">
                {notifications.map((notification) => (
                  <li key={notification.id} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                    <p className="notification-item-message">{notification.message}</p>
                    <span className="notification-item-timestamp">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                    {!notification.read && (
                      <button
                        className="notification-action-button primary"
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        Mark as Read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center" style={{ color: 'var(--text-medium)' }}>No new notifications.</p>
            )}
            {notifications.length > 0 && (
                <div className="notification-actions">
                    <button className="notification-action-button secondary" onClick={clearAllNotifications}>
                        Clear All
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PgOwnerDashboard;
