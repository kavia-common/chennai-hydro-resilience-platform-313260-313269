import React from 'react';
import './Loader.css';

// PUBLIC_INTERFACE
/**
 * Loader component for displaying loading states.
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Loader size: 'small', 'medium', 'large'
 * @param {string} props.text - Optional loading text
 */
const Loader = ({ size = 'medium', text }) => {
  return (
    <div className="loader-container">
      <div className={`loader loader-${size}`}></div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;
