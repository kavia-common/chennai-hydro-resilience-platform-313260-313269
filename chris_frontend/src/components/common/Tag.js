import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Tag.css';

// PUBLIC_INTERFACE
/**
 * Tag/Pill component for displaying status labels and badges.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Tag content
 * @param {string} props.variant - Tag color variant: 'success', 'error', 'warning', 'info', 'neutral'
 * @param {string} props.size - Tag size: 'sm', 'md', 'lg'
 * @param {object} props.icon - FontAwesome icon object
 * @param {Function} props.onClose - Close handler (makes tag closable)
 * @param {string} props.className - Additional CSS classes
 */
const Tag = ({ 
  children, 
  variant = 'neutral', 
  size = 'md',
  icon,
  onClose,
  className = '' 
}) => {
  return (
    <span className={`tag tag-${variant} tag-${size} ${onClose ? 'tag-closable' : ''} ${className}`}>
      {icon && <FontAwesomeIcon icon={icon} className="tag-icon" />}
      {children}
      {onClose && (
        <button className="tag-close" onClick={onClose} aria-label="Remove tag">
          ×
        </button>
      )}
    </span>
  );
};

export default Tag;
