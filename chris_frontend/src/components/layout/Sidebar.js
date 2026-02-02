import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faCloudRain, 
  faMapMarkedAlt, 
  faFileAlt,
  faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons';
import useUIStore from '../../store/useUIStore';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

// PUBLIC_INTERFACE
/**
 * Sidebar component with navigation menu.
 * Provides links to main application pages with icons.
 */
const Sidebar = () => {
  const { sidebarOpen } = useUIStore();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { path: '/dashboard', icon: faChartLine, label: 'Dashboard' },
    { path: '/forecast', icon: faCloudRain, label: 'Flood Forecast' },
    { path: '/zone-explorer', icon: faMapMarkedAlt, label: 'Zone Explorer' },
    { path: '/reports', icon: faFileAlt, label: 'Reports' },
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            data-label={item.label}
          >
            <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-link" onClick={handleSignOut} data-label="Sign Out">
          <FontAwesomeIcon icon={faSignOutAlt} className="sidebar-icon" />
          <span className="sidebar-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
