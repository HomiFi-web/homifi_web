import React from 'react';
import './main.css'; // This path expects main.css in the 'src' directory

const ContactUs = () => {
  return (
    <div className="contact-us-container">
      <header className="contact-us-header">
        <h1>Contact HomiFi</h1>
        <p className="subtitle">We're Here to Help!</p>
      </header>

      <section className="contact-us-section info-section">
        <p>
          Have questions, feedback, or need assistance? Don't hesitate to reach out to the HomiFi team.
          We're dedicated to providing you with the best experience and are happy to assist with any inquiries you may have.
        </p>

        <div className="contact-details">
          <h3>Reach Out Directly:</h3>
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
            Kristu Jayanti College, Bengaluru, Karnataka, 560077
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
