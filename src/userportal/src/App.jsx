// src/App.js
import { useState } from 'react';
import Cookies from 'js-cookie';
import Login from './pages/Login';
import Shell from './pages/Shell';
import './App.css'; // Import the CSS file

function App() {
  // default to be logged in, if login is required, set it to false
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => { 
    setIsLoggedIn(false);
  };

  return (
      <div >
        {isLoggedIn ? <Shell onLogout={handleLogout}  /> : <Login onLogin={handleLogin} />}
      </div>
  );
}

export default App;
