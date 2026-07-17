import React from 'react';
// @ts-ignore
import logoImg from '../assets/images/sanwariya_logo_1784287184090.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const heightClasses = {
    sm: 'h-10 sm:h-12',
    md: 'h-16 sm:h-20',
    lg: 'h-32 sm:h-40'
  };

  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-full ${className}`}>
      <img
        src={logoImg}
        alt="Sanwariya Watches"
        className={`${heightClasses[size]} w-auto object-contain transition-transform duration-500 hover:scale-105`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

