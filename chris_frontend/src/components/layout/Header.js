import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faBars } from '@fortawesome/free-solid-svg-icons';
import useUIStore from '../../store/useUIStore';
import './Header.css';

// PUBLIC_INTERFACE
/**
 * Header component with theme toggle and sidebar control.
 * Displays app branding and provides quick access to theme switching.
 */
const Header = () => {
  const { theme, toggleTheme, toggleSidebar } = useUIStore();

  return (
    <header className="header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <h1 className="header-title">CHRIS</h1>
        <span className="header-subtitle">Chennai Hydro-Resilience Intelligence System</span>
      </div>
      <div className="header-right">
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
        </button>
      </div>
    </header>
  );
};

export default Header;
