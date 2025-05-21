import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PgOwnerDashboard.css'; // Corrected import path for the CSS file

const PgOwnerDashboard = () => {
  const navigate = useNavigate();
  const [pgName, setPgName] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState([]); // Array to hold multiple selected shares
  const [photos, setPhotos] = useState([]);
  const [prices, setPrices] = useState({
    '2 Share': '',
    '3 Share': '',
    '4 Share': '',
  });
  const [facilities, setFacilities] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // List of all possible sharing options
  const allSharingOptions = ['2 Share', '3 Share', '4 Share'];

  // Handles changes to the multi-select availability dropdown
  const handleAvailabilityChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setAvailability(selectedOptions);

    // Clear prices for options that are no longer selected
    setPrices((prevPrices) => {
      const newPrices = { ...prevPrices };
      allSharingOptions.forEach((option) => {
        if (!selectedOptions.includes(option)) {
          newPrices[option] = ''; // Clear price if availability is deselected
        }
      });
      return newPrices;
    });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length <= 5) { // Limit to 5 photos
        setPhotos(files);
      } else {
        setError('You can upload a maximum of 5 photos.');
      }
    }
  };

  const handlePriceChange = (share, price) => {
    setPrices((prevPrices) => ({
      ...prevPrices,
      [share]: price,
    }));
  };

  const handleEdit = () => {
    // Implement edit logic here, e.g., navigate back to a form with pre-filled data
    alert('Edit functionality not implemented yet.');
  };

  const handleSendForValidation = () => {
    setLoading(true);
    setError('');

    // Basic validation for required fields
    if (!pgName || !location || availability.length === 0 || photos.length === 0 || !facilities) {
      setError('Please fill in all required fields and upload at least one photo.');
      setLoading(false);
      return;
    }

    // Validate prices only for selected availability options
    const missingPrices = availability.filter(
      (shareOption) => !prices[shareOption]
    );

    if (missingPrices.length > 0) {
      setError(`Please provide prices for: ${missingPrices.join(', ')}`);
      setLoading(false);
      return;
    }

    // Simulate sending data for validation
    setTimeout(() => {
      setLoading(false);
      alert('PG details submitted for validation!');
      // navigate('/some-dashboard'); // Redirect after successful submission
    }, 2000);
  };

  return (
    <div className="pg-details-container">
      <h1 className="pg-details-title">Welcome PG Owner</h1>

      <div className="pg-details-form-card">
        <h2 className="pg-details-section-heading">PG Details</h2>

        <div className="form-group">
          <label htmlFor="pgName" className="form-label">
            PG Name <span className="required-field">*</span>
          </label>
          <input
            id="pgName"
            type="text"
            value={pgName}
            onChange={(e) => setPgName(e.target.value)}
            placeholder="Enter PG Name"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="location" className="form-label">
            Location <span className="required-field">*</span>
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter Location"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Availability <span className="required-field">*</span>
          </label>
          <select
            id="availability" // Added ID for accessibility
            value={availability}
            onChange={handleAvailabilityChange}
            className="form-select"
            multiple={true} // Explicitly set to true for multi-select
          >
            <option value="" disabled>Select Availability Options</option>
            {allSharingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="photos" className="form-label">
            Photos of PG <span className="required-field">*</span> (Max 5)
          </label>
          <input
            id="photos"
            type="file"
            multiple
            onChange={handlePhotoChange}
            className="form-input"
            accept="image/*"
            required
          />
          {photos.length > 0 && (
            <div className="photo-preview-grid">
              {photos.map((photo, index) => (
                <div key={index} className="photo-preview-item">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Uploaded ${index + 1}`}
                    className="photo-preview-image"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            Price for <span className="required-field">*</span>
          </label>
          <div className="price-input-grid">
            {allSharingOptions.map((option) =>
              availability.includes(option) ? ( // Conditionally render based on availability
                <div key={option} className="price-input-group">
                  <label htmlFor={`${option.replace(/\s/g, '')}Price`} className="price-label">
                    {option}
                  </label>
                  <input
                    id={`${option.replace(/\s/g, '')}Price`}
                    type="number"
                    value={prices[option]}
                    onChange={(e) => handlePriceChange(option, e.target.value)}
                    placeholder="Enter Price"
                    className="price-input"
                    required // Make required if rendered
                  />
                </div>
              ) : null
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="facilities" className="form-label">
            Facilities / Amenities <span className="required-field">*</span>
          </label>
          <textarea
            id="facilities"
            value={facilities}
            onChange={(e) => setFacilities(e.target.value)}
            placeholder="Enter facilities (e.g., Wi-Fi, AC, Food, Laundry)"
            className="form-textarea"
            rows={4}
            required
          />
        </div>

        {error && <p className="error-error-message">{error}</p>}

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
        </div>
      </div>
    </div>
  );
};

export default PgOwnerDashboard;