'use client';

import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick 
}) => {
  return (
    <div 
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-md p-4 border border-gray-700 hover:border-pink-500/30 transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card; 