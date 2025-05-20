// src/pages/ContactUs.jsx
import React from 'react';
import './ContactUs.css';

const ContactUs = () => {
  return (
    <div className="contact-us-container">
      <header className="contact-us-header">
        <h1>Contact HomiFi</h1>
        <p className="subtitle">We're Here to Help!</p>
      </header>

      {/* This section now starts directly with the introductory paragraph
          without an explicit "Introduction" or "Get in Touch" heading above it. */}
      <section className="contact-us-section info-section">
        <p>
          Have questions, feedback, or need assistance? Don't hesitate to reach out to the HomiFi team.
          We're dedicated to providing you with the best experience and are happy to assist with any inquiries you may have.
        </p>

        {/* The contact details themselves can remain under a logical grouping without a redundant heading */}
        <div className="contact-details">
          <h3>Reach Out Directly:</h3> {/* Added a smaller, more specific heading here */}
          <p>
            <strong>Phone:</strong>
            {' '}
            <a href="tel:+916366049251">6366049251</a>
            {' '} / {' '}
            <a href="tel:+919019844260">9019844260</a>
          </p>
          <p><strong>Email:</strong> <a href="mailto:homifi7@gmail.com">homifi7@gmail.com</a></p>
          <p>
            <strong>Address:</strong>
            <br />
            HomiFi Headquarters
            <br />
            [Your Street Address, e.g., 123 Main Street]
            <br />
            [City, State, Pincode, e.g., Bengaluru, Karnataka, 560001]
          </p>
        </div>

        <div className="business-hours">
          <h3>Business Hours:</h3>
          <p>Monday - Friday: 9:00 AM - 6:00 PM (IST)</p>
          <p>Saturday: 10:00 AM - 2:00 PM (IST)</p>
          <p>Sunday: Closed</p>
        </div>
      </section>

      <section className="contact-us-section message-section">
        <h2>Send Us a Message</h2>
        <p>
          We'd love to hear from you! For quick inquiries, fill out the form below.
          For detailed support, you can always email us directly.
        </p>
        {/* Placeholder for a contact form - you'll add input fields and a submit button here */}
        <p>
          <a href="mailto:homifi7@gmail.com" className="email-link">
            Click here to email us directly.
          </a>
        </p>
      </section>
    </div>
  );
};

export default ContactUs;