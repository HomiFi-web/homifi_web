import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Keep if other navigations are planned
import PgOwnerDashboard from './PgOwnerDashboard'; // Import the PgOwnerDashboard component
import './PgDetails.css'; // Import the CSS for this container page

const PgDetails = () => {
  const [submittedData, setSubmittedData] = useState(null); // State to hold submitted data

  // useEffect to load data from localStorage when the component mounts or updates
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('currentPgDetails');
      if (storedData) {
        setSubmittedData(JSON.parse(storedData));
      } else {
        setSubmittedData(null); // Ensure data is null if nothing is stored
      }
    } catch (error) {
      console.error("Failed to parse stored PG details:", error);
      localStorage.removeItem('currentPgDetails'); // Clear corrupted data
      setSubmittedData(null);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Function to clear data and show the form again
  const handleClearData = () => {
    localStorage.removeItem('currentPgDetails');
    setSubmittedData(null); // Clear state to re-render and show the form
  };

  return (
    <div className="pg-details-container">
      <h1 className="pg-details-title">
        Welcome PG Owner
      </h1>

      {submittedData ? (
        // Display submitted details if data exists
        <div className="pg-details-display-card">
          <h2 className="pg-details-section-heading">Your PG Details Submitted for Validation</h2>
          <div className="pg-details-info-grid">
            <div className="pg-info-group">
              <p><strong>PG Name:</strong></p>
              <span>{submittedData.pgName}</span>
            </div>
            <div className="pg-info-group">
              <p><strong>PG Owner Name:</strong></p>
              <span>{submittedData.pgOwnerName}</span>
            </div>
            <div className="pg-info-group">
              <p><strong>Phone Number:</strong></p>
              <span>{submittedData.pgOwnerPhoneNumber}</span>
            </div>
            <div className="pg-info-group full-width">
              <p><strong>Address:</strong></p>
              <span>{submittedData.address}, {submittedData.pincode}</span>
            </div>
            <div className="pg-info-group">
              <p><strong>State:</strong></p>
              <span>{submittedData.state}</span>
            </div>
            <div className="pg-info-group">
              <p><strong>Country:</strong></p>
              <span>{submittedData.country}</span>
            </div>
            {submittedData.locationLink && (
              <div className="pg-info-group full-width">
                <p><strong>Location Link:</strong></p>
                <span><a href={submittedData.locationLink} target="_blank" rel="noopener noreferrer">{submittedData.locationLink}</a></span>
              </div>
            )}
          </div>

          <h3 className="sub-section-heading">Availability & Pricing:</h3>
          <ul className="submitted-list">
            {submittedData.sharingOptions.length > 0 ? (
              submittedData.sharingOptions.map((option, index) => (
                <li key={index}>
                  <strong>{option.type}:</strong> {option.status} - {option.price ? `₹${option.price}` : 'Price not set'}
                </li>
              ))
            ) : (
              <li>No sharing options provided.</li>
            )}
          </ul>

          <h3 className="sub-section-heading">Facilities:</h3>
          <ul className="submitted-list facilities-list">
            {submittedData.facilities.length > 0 ? (
              submittedData.facilities.map((facility, index) => (
                <li key={index}>{facility}</li>
              ))
            ) : (
              <li>No facilities selected.</li>
            )}
          </ul>

          <h3 className="sub-section-heading">Photos:</h3>
          {submittedData.photos.length > 0 ? (
            <div className="submitted-photos-grid">
              {submittedData.photos.map((photo, index) => (
                <div key={index} className="submitted-photo-item">
                  <img src={photo.url} alt={`PG Photo ${index + 1}`} className="submitted-photo-image" />
                  {photo.caption && <p className="submitted-photo-caption">{photo.caption}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p>No photos uploaded.</p>
          )}

          <div className="form-actions mt-4">
            <button onClick={handleClearData} className="button button-primary">
              Edit PG Details
            </button>
          </div>
        </div>
      ) : (
        // Render the form if no submitted data exists
        <div className="pg-details-form-container">
          <h2 className="pg-details-form-heading">PG Details Submission</h2>
          <PgOwnerDashboard />
        </div>
      )}
    </div>
  );
};

export default PgDetails;
