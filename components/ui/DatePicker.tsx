'use client';

import React from 'react';

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function DatePicker({ label, error, required, className = '', ...props }: DatePickerProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="date"
        className={`
          w-full px-4 py-3 text-base
          border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        style={{ fontSize: '16px' }} // Prevent iOS zoom
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}



