import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaGraduationCap,
  FaBook,
  FaTrophy,
  FaUsers,
  FaChartLine,
  FaBell,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import api from '../../utils/api';
import LanguageSwitcher from '../common/LanguageSwitcher';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificationCount();
    }
  }, [isAuthenticated]);

  const fetchNotificationCount = async () => {
    try {
      const response = await api.get('/social/notifications?unreadOnly=true');
      setNotificationCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaChartLine /> },
    { path: '/leermaterialen', label: 'Leermaterialen', icon: <FaBook /> },
    { path: '/badges', label: 'Badges', icon: <FaTrophy /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <FaUsers /> },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo">
          <FaGraduationCap className="logo-icon" />
          <span>AI Literacy</span>
        </Link>

        {isAuthenticated && (
          <>
            <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
              <ul className="navbar-links">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="navbar-actions">
              <LanguageSwitcher />

              <div className="user-points">
                <span className="points-icon">⭐</span>
                <span className="points-value">{user?.totalPoints || 0}</span>
              </div>

              <div className="user-level">
                <span className="level-badge">Niveau {user?.level || 1}</span>
              </div>

              <button className="notification-btn" title="Meldingen">
                <FaBell />
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}
              </button>

              <div className="user-menu-container">
                <button
                  className="user-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="user-avatar" />
                  ) : (
                    <div className="user-avatar-placeholder">
                      <FaUser />
                    </div>
                  )}
                  <span className="user-name-display">
                    {user?.firstName || user?.name || 'User'}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                      <p className="user-menu-name">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="user-menu-email">{user?.email}</p>
                    </div>
                    <div className="user-menu-links">
                      <Link
                        to={`/profile/${user?.id}`}
                        className="user-menu-link"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FaUser /> Profiel
                      </Link>
                      <button className="user-menu-link" onClick={logout}>
                        <FaSignOutAlt /> Uitloggen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </>
        )}

        {!isAuthenticated && (
          <div className="navbar-auth">
            <LanguageSwitcher />
            <Link to="/login" className="btn btn-outline btn-sm">
              Inloggen
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Registreren
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
