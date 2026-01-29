'use client';

import React, { useCallback, useState } from 'react';

interface DocumentUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function DocumentUpload({
  onFileSelected,
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMB = 50,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (PNG, JPG)');
      return false;
    }
    
    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return false;
    }
    
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelected(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8
          transition-all duration-200 ease-in-out
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
        `}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Upload Icon */}
          <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-200'}`}>
            <svg
              className={`w-10 h-10 ${isDragging ? 'text-blue-600' : 'text-gray-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          {/* Text */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              {isDragging ? 'Drop your document here' : 'Drag and drop your document'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse
            </p>
          </div>
          
          {/* Supported formats */}
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span className="px-2 py-1 bg-gray-200 rounded">PDF</span>
            <span className="px-2 py-1 bg-gray-200 rounded">PNG</span>
            <span className="px-2 py-1 bg-gray-200 rounded">JPG</span>
          </div>
          
          <p className="text-xs text-gray-400">
            Max file size: {maxSizeMB}MB
          </p>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
