import React, { useState } from 'react';
import { app } from './firebase/firebase'; // Firebase configuration
import Login from './login'; // Import the Login component
import UserLogin from './UserLogin'; // Import UserLogin component
import AdminLogin from './AdminLogin'; // Import AdminLogin component (you will need to create it)
import PgOwnerLogin from './PgOwnerLogin'; // Import PG Owner Login component (you will need to create it)

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // State to manage current page

  // Function to handle button clicks and set the login type
  const handleLoginClick = (type) => {
    setCurrentPage(type); // Change the page based on the type (user, admin, or pgOwner)
  };

  return (
    <div className="App">
      <h1>HomiFi Web App</h1>

      {/* Conditionally render login page */}
      {currentPage === 'home' && <Login onButtonClick={handleLoginClick} />} {/* Initial login page */}
      {currentPage === 'user' && <UserLogin />} {/* User login */}
      {currentPage === 'admin' && <AdminLogin />} {/* Admin login (to be created) */}
      {currentPage === 'pgOwner' && <PgOwnerLogin />} {/* PG Owner login (to be created) */}
    </div>
  );
}

export default App;
