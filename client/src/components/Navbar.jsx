import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar__left">
        <span className="navbar__logo-icon">🍃</span>
        <span className="navbar__logo-text">SplitLeaf</span>
      </Link>
      {user && (
        <div className="navbar__right">
          <span className="navbar__username">{user.name}</span>
          <button className="navbar__logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
