'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function Input({ label, error, required, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5 font-display">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 text-base
          bg-white border rounded-xl
          transition-all duration-200
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
          ${error ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-500' : 'border-slate-200 hover:border-slate-300'}
          ${className}
        `}
        style={{ fontSize: '16px' }}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
