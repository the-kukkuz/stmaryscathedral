import React from 'react';
import '../css/navbar.css';
import pic1 from '../assets/images/logo.jpg'; 
import { useNavigate } from 'react-router-dom';  
import PdfGenerator from "../components/pdfGenerator";
const Navbar = () => {
  const navigate = useNavigate();

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
        <span onClick={() => navigate('/SignIn')} className="nav-link">Sign In</span>
        <PdfGenerator/>
      </div>
    </nav>
  );
};

export default Navbar;
