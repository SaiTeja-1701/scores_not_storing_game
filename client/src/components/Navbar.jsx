import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <h1 className="text-gradient">
            Expression Tracker
            </h1>
      <Link to="/" className="nav-link">Home</Link>
      <Link to="/register" className="nav-link">Register</Link>
      <Link to="/login" className="nav-link">Login</Link>
    </nav>
  );
}
