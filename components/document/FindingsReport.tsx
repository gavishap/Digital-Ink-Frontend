'use client';

import React from 'react';
import type { ExtractionResult } from '@/lib/api/extraction';

interface FindingsReportProps {
  results: ExtractionResult;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function FindingsReport({ results, isGenerating, onGenerate }: FindingsReportProps) {
  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.85) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Findings Report</h2>
            <p className="text-purple-100 text-sm mt-1">
              Generate a detailed DOCX document with all extracted findings
            </p>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="p-6">
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          {/* Document Preview */}
          <div className="bg-white border border-gray-300 rounded shadow-sm p-6 max-w-xl mx-auto">
            {/* Header */}
            <div className="text-center border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Medical Form Extraction Report</h3>
              <p className="text-sm text-gray-500 mt-1">{results.form_name}</p>
            </div>

            {/* Patient Info */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Patient Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 text-gray-900">{results.patient_name || 'Not detected'}</span>
                </div>
                <div>
                  <span className="text-gray-500">DOB:</span>
                  <span className="ml-2 text-gray-900">{results.patient_dob || 'Not detected'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Form Date:</span>
                  <span className="ml-2 text-gray-900">{results.form_date || 'Not detected'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Confidence:</span>
                  <span className={`ml-2 font-medium ${getConfidenceColor(results.overall_confidence)}`}>
                    {(results.overall_confidence * 100).toFixed(0)}% ({getConfidenceLabel(results.overall_confidence)})
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Summary</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>- Total Pages: {results.pages.length}</li>
                <li>- Fields Extracted: {results.pages.reduce((sum, p) => sum + Object.keys(p.field_values).length, 0)}</li>
                <li>- Annotation Groups: {results.pages.reduce((sum, p) => sum + p.annotation_groups.length, 0)}</li>
                <li className={results.total_items_needing_review > 0 ? 'text-orange-600 font-medium' : ''}>
                  - Items for Review: {results.total_items_needing_review}
                </li>
              </ul>
            </div>

            {/* Preview indicator */}
            <div className="text-center text-gray-400 text-xs border-t border-gray-200 pt-4">
              [Report preview - Download for full document]
            </div>
          </div>
        </div>

        {/* Report Contents Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="font-medium text-blue-900">Field Values</h4>
            </div>
            <p className="text-sm text-blue-700">
              All extracted field values organized by page with confidence scores
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <h4 className="font-medium text-purple-900">Annotations</h4>
            </div>
            <p className="text-sm text-purple-700">
              Clinical annotation groups with interpretations and significance
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="font-medium text-orange-900">Review Items</h4>
            </div>
            <p className="text-sm text-orange-700">
              Items flagged for human review with explanations
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`
              px-8 py-3 rounded-lg font-medium text-white
              flex items-center space-x-2
              ${isGenerating
                ? 'bg-purple-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
              }
              transition-colors
            `}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Generate & Download DOCX</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
