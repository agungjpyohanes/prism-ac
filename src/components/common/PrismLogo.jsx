import React from 'react';

export default function PrismLogo({ className = "w-8 h-8", alt = "PRISM Logo" }) {
  return (
    <img 
      src="/favicon.png" 
      alt={alt} 
      className={`object-contain ${className}`} 
    />
  );
}
