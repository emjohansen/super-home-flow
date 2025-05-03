
import React from 'react';

type AvatarProps = {
  name: string | null;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const Avatar = ({ name, color = '#4A9F41', size = 'md', className = '' }: AvatarProps) => {
  // Get initials from name
  const getInitials = () => {
    if (!name) return '?';
    
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    } else {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
  };
  
  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white ${className}`}
      style={{ backgroundColor: color }}
    >
      {getInitials()}
    </div>
  );
};

export default Avatar;
