import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faInfoCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import './Alert.css';

// PUBLIC_INTERFACE
/**
 * Alert component for displaying notifications and messages.
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Alert type: 'success', 'error', 'warning', 'info'
 * @param {React.ReactNode} props.children - Alert content
 * @param {Function} props.onClose - Close handler (optional)
 * @param {string} props.className - Additional CSS classes
 */
const Alert = ({ type = 'info', children, onClose, className = '' }) => {
  const icons = {
    success: faCheckCircle,
    error: faTimesCircle,
    warning: faExclamationTriangle,
    info: faInfoCircle,
  };

  return (
    <div className={`alert alert-${type} ${className}`}>
      <FontAwesomeIcon icon={icons[type]} className="alert-icon" />
      <div className="alert-content">{children}</div>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
