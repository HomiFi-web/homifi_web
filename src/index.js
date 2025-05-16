import React from 'react';
import ReactDOM from 'react-dom/client';  // Updated import
import './index.css';
import App from './App';

// Get the root element where the app will be rendered
const rootElement = document.getElementById('root');

// Create a root for React 18
const root = ReactDOM.createRoot(rootElement);

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
