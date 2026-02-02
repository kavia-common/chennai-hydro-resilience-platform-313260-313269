import React from 'react';
import './Skeleton.css';

// PUBLIC_INTERFACE
/**
 * Skeleton loader component for displaying loading placeholders.
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Skeleton variant: 'text', 'title', 'circle', 'card', 'avatar'
 * @param {number} props.width - Custom width in pixels or percentage
 * @param {number} props.height - Custom height in pixels
 * @param {number} props.count - Number of skeleton elements to render
 * @param {string} props.className - Additional CSS classes
 */
const Skeleton = ({ 
  variant = 'text', 
  width, 
  height, 
  count = 1,
  className = '' 
}) => {
  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const skeletonClass = `skeleton skeleton-${variant} ${className}`;

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={skeletonClass} style={style} />
        ))}
      </>
    );
  }

  return <div className={skeletonClass} style={style} />;
};

export default Skeleton;
