import React, { useState, useEffect } from 'react';
import '../css/navbar.css';
import pic1 from '../assets/images/logo.jpg';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const isTokenValid = (token) => {
      if (!token) return false;
      try {
        const decoded = jwtDecode(token);
        if (!decoded?.exp) return false;
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp > now;
      } catch {
        return false;
      }
    };

    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('username');
      setIsAuthenticated(isTokenValid(token));
      setUsername(user || 'User');
    };

    checkAuth();
  }, [location]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/SignIn');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo-wrapper" onClick={() => navigate('About')} role="button" tabIndex="0">
          <img src={pic1} alt="Church Logo" className="logo" />
        </div>
        <h1 className="site-title" onClick={() => navigate('/')}>
          ST MARY'S JACOBITE SYRIAN CATHEDRAL, PALLIKARA
        </h1>
      </div>
      <div className="navbar-right">
        <span onClick={() => navigate('/')} className="nav-link">Home</span>
        <span onClick={() => navigate('/About')} className="nav-link">About</span>
        {isAuthenticated ? (
          <>
            <span className="nav-link" style={{ cursor: 'default' }}>{username}</span>
            <span onClick={handleSignOut} className="nav-link">Sign Out</span>
          </>
        ) : (
          <span onClick={() => navigate('/SignIn')} className="nav-link">Sign In</span>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
