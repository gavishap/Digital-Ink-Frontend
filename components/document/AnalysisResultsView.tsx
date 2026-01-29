'use client';

import React, { useEffect, useRef } from 'react';
import type { ExtractionResult } from '@/lib/api/extraction';

interface AnalysisResultsViewProps {
  results: ExtractionResult;
  onDownloadReport: () => void;
  onStartOver: () => void;
  isDownloading?: boolean;
}

export function AnalysisResultsView({
  results,
  onDownloadReport,
  onStartOver,
  isDownloading = false,
}: AnalysisResultsViewProps) {
  const autoDownloadedRef = useRef(false);

  // Auto-trigger download on first render
  useEffect(() => {
    if (!autoDownloadedRef.current) {
      autoDownloadedRef.current = true;
      onDownloadReport();
    }
  }, [onDownloadReport]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBgColor = (confidence: number): string => {
    if (confidence >= 0.85) return 'bg-green-100';
    if (confidence >= 0.7) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const totalFields = results.pages.reduce(
    (sum, p) => sum + Object.keys(p.field_values).length,
    0
  );
  const totalAnnotations = results.pages.reduce(
    (sum, p) => sum + p.annotation_groups.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Analysis Complete</h1>
          <p className="text-green-100">
            Your documents have been analyzed and the findings report is ready
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Patient Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
              <p className="text-sm font-medium text-gray-900">
                {results.patient_name || 'Not detected'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
              <p className="text-sm font-medium text-gray-900">
                {results.patient_dob || 'Not detected'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Form Date</p>
              <p className="text-sm font-medium text-gray-900">
                {results.form_date || 'Not detected'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Extracted</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(results.extraction_timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{results.pages.length}</p>
            <p className="text-sm text-gray-500">Pages Analyzed</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{totalFields}</p>
            <p className="text-sm text-gray-500">Fields Extracted</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{totalAnnotations}</p>
            <p className="text-sm text-gray-500">Annotation Groups</p>
          </div>
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center`}>
            <p className={`text-3xl font-bold ${getConfidenceColor(results.overall_confidence)}`}>
              {(results.overall_confidence * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-500">Confidence</p>
          </div>
        </div>

        {/* Review Items Warning */}
        {results.total_items_needing_review > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-orange-800">
                  {results.total_items_needing_review} Items Require Review
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Some extracted data has low confidence or ambiguous content. Please review these items in the downloaded report.
                </p>
                {results.all_review_reasons.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {results.all_review_reasons.slice(0, 3).map((reason, idx) => (
                      <li key={idx} className="text-sm text-orange-700 flex items-start">
                        <span className="mr-2">-</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                    {results.all_review_reasons.length > 3 && (
                      <li className="text-sm text-orange-600 italic">
                        ...and {results.all_review_reasons.length - 3} more in the report
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Page-by-Page Summary</h2>
          <div className="space-y-3">
            {results.pages.map((page) => (
              <div
                key={page.page_number}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {page.page_number}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Page {page.page_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Object.keys(page.field_values).length} fields, {page.annotation_groups.length} annotations
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {page.items_needing_review > 0 && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      {page.items_needing_review} to review
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBgColor(page.overall_confidence)} ${getConfidenceColor(page.overall_confidence)}`}>
                    {(page.overall_confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onDownloadReport}
            disabled={isDownloading}
            className={`px-8 py-3 rounded-xl font-medium text-white flex items-center justify-center space-x-2 ${
              isDownloading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Report Again</span>
              </>
            )}
          </button>

          <button
            onClick={onStartOver}
            className="px-8 py-3 rounded-xl font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Analyze New Documents</span>
          </button>
        </div>

        {/* Report Auto-Download Notice */}
        <p className="text-center text-sm text-gray-500 mt-6">
          The findings report has been automatically downloaded to your computer.
          <br />
          Check your downloads folder for the DOCX file.
        </p>
      </div>
    </div>
  );
}
