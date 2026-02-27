'use client';

import React, { useRef, useEffect } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
  autoExpand?: boolean;
}

export function TextArea({
  label,
  error,
  required,
  autoExpand = false,
  className = '',
  ...props
}: TextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoExpand && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [props.value, autoExpand]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={textareaRef}
        className={`
          w-full px-4 py-3 text-base
          border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          resize-none
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



