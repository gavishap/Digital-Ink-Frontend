'use client';

import React, { useState, useEffect } from 'react';

interface DocumentViewerProps {
  file: File | null;
  onRemove?: () => void;
}

export function DocumentViewer({ file, onRemove }: DocumentViewerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setPageCount(null);
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsPdf(file.type === 'application/pdf');

    // Clean up URL on unmount
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!file || !previewUrl) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* File icon */}
          <div className={`p-2 rounded-lg ${isPdf ? 'bg-red-100' : 'bg-blue-100'}`}>
            {isPdf ? (
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 18h12a2 2 0 002-2V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2zm8-14l4 4h-4V4zM7 11h6v1H7v-1zm0 2h6v1H7v-1zm0 2h4v1H7v-1z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
            )}
          </div>
          
          {/* File info */}
          <div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
              {pageCount && ` - ${pageCount} page${pageCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        
        {/* Remove button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove document"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Preview */}
      <div className="relative bg-gray-100 p-4">
        {isPdf ? (
          <div className="w-full aspect-[8.5/11] bg-white rounded-lg shadow-inner flex items-center justify-center">
            <embed
              src={`${previewUrl}#toolbar=0&navpanes=0`}
              type="application/pdf"
              className="w-full h-full rounded-lg"
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <img
              src={previewUrl}
              alt={file.name}
              className="max-w-full max-h-[600px] object-contain rounded-lg shadow-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
