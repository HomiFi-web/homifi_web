// src/pages/AboutUs.jsx
import React from 'react';
import './main.css'; // Corrected path: main.css is in the same directory

const AboutUs = () => {
  return (
    <div className="about-us-container">
      <header className="about-us-header">
        <h1>About HomiFi</h1>
        <p className="subtitle">Connecting You to Your Perfect Home Away From Home</p>
      </header>

      <section className="about-us-section introduction">
        <h2>Welcome to HomiFi</h2>
        <p>
          Your trusted partner in finding and managing paying guest (PG) accommodations.
          Born from a simple idea during our MCA project at college, HomiFi was conceived to make the process of finding a safe, comfortable, and affordable PG as effortless as possible.
          We are dedicated to bridging the gap between those seeking quality living spaces and the property owners who provide them.
        </p>
      </section>

      <section className="about-us-section mission">
        <h2>Our Mission</h2>
        <p>
          At HomiFi, our mission is to revolutionize the PG accommodation experience. We strive to create a transparent, efficient, and reliable platform that empowers both users to find their ideal living environment and PG owners to manage their properties with unparalleled ease. We believe that everyone deserves a place that feels like home, even when they're away from it.
        </p>
      </section>

      <section className="about-us-section offerings">
        <h2>What We Offer</h2>
        <div className="offerings-grid">
          <div className="offering-card">
            <h3>For PG Seekers</h3>
            <ul>
              <li>Extensive listings with detailed information</li>
              <li>High-quality images and virtual tours</li>
              <li>Filter and search options for tailored results</li>
              <li>Direct contact with property owners</li>
              <li>User reviews and ratings for informed decisions</li>
            </ul>
          </div>
          <div className="offering-card">
            <h3>For PG Owners</h3>
            <ul>
              <li>Easy property listing and management</li>
              <li>Reach a wide audience of potential tenants</li>
              <li>Tools for managing inquiries and bookings</li>
              <li>Showcase your property with rich media</li>
              <li>Efficient communication features</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-us-section vision">
        <h2>Our Vision</h2>
        <p>
          To be the leading platform for PG accommodations, recognized for our commitment to quality, transparency, and user satisfaction. We envision a future where finding and managing a PG is stress-free, fostering vibrant communities and creating positive living experiences for all.
        </p>
      </section>

      <section className="about-us-section why-choose-us">
        <h2>Why Choose HomiFi?</h2>
        <p>
          We are more than just a listing platform; we are a community-driven service built on trust and convenience. Our dedicated team works tirelessly to ensure data accuracy, user security, and continuous improvement, making HomiFi the smart choice for your accommodation needs.
        </p>
      </section>

      {/* NEW FOUNDERS SECTION */}
      <section className="about-us-section founders-section">
        <h2>Our Founders</h2>
        <p>
          HomiFi was brought to life by the dedication and innovative spirit of <strong>Ananya KR</strong> and <strong>Grace Reshal Lewis</strong>. During their MCA project at college, they identified a clear need for a more organized and accessible PG ecosystem, leading them to conceptualize and develop this platform.
        </p>
      </section>

    </div>
  );
};

export default AboutUs;