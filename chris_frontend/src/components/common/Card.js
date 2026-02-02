import React from 'react';
import './Card.css';

// PUBLIC_INTERFACE
/**
 * Card component with glassmorphism effect.
 * Provides a styled container for content with backdrop blur and subtle borders.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 * @param {Object} props.style - Inline styles
 */
const Card = ({ children, className = '', onClick, style }) => {
  return (
    <div 
      className={`card ${className}`} 
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

export default Card;
