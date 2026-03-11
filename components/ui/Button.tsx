'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantStyles = {
  primary:
    'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft hover:from-primary-700 hover:to-primary-800 hover:shadow-glow focus:ring-primary-500 active:scale-[0.97]',
  secondary:
    'bg-accent-600 text-white shadow-soft hover:bg-accent-700 hover:shadow-glow-accent focus:ring-accent-500 active:scale-[0.97]',
  outline:
    'border border-slate-200 text-slate-700 bg-white hover:bg-surface-50 hover:border-slate-300 focus:ring-primary-500 active:scale-[0.97]',
  ghost:
    'text-slate-600 hover:text-slate-900 hover:bg-surface-100 focus:ring-primary-500 active:scale-[0.97]',
  danger:
    'bg-rose-600 text-white shadow-soft hover:bg-rose-700 focus:ring-rose-500 active:scale-[0.97]',
};

const sizeStyles = {
  sm: 'px-3.5 py-2 text-sm min-h-[36px]',
  md: 'px-5 py-2.5 text-sm min-h-[42px]',
  lg: 'px-7 py-3.5 text-base min-h-[50px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:pointer-events-none
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
