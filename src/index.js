// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // This imports your global CSS styles and variables
import App from './App'; // This imports your main App component

// Get the root element from public/index.html where the app will be mounted
const rootElement = document.getElementById('root');

// Create a React 18 root
const root = ReactDOM.createRoot(rootElement);

// Render the application within React.StrictMode for development checks
root.render(
  <React.StrictMode>
    <App /> {/* Your entire application starts here */}
  </React.StrictMode>
);