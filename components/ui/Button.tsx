'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary:
      'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline:
      'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-[44px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

