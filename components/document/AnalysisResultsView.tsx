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
    if (confidence >= 0.85) return 'text-emerald-600';
    if (confidence >= 0.7) return 'text-amber-600';
    return 'text-red-500';
  };

  const getConfidenceBg = (confidence: number): string => {
    if (confidence >= 0.85) return 'bg-emerald-50 ring-emerald-200';
    if (confidence >= 0.7) return 'bg-amber-50 ring-amber-200';
    return 'bg-red-50 ring-red-200';
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
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-stone-800">Analysis Complete</h1>
              <p className="text-sm text-stone-500">Your documents have been processed successfully</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-8 py-10">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-stone-800 mb-1">{results.pages.length}</p>
            <p className="text-sm font-medium text-stone-500">Pages Analyzed</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-stone-800 mb-1">{totalFields}</p>
            <p className="text-sm font-medium text-stone-500">Fields Extracted</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-stone-800 mb-1">{totalAnnotations}</p>
            <p className="text-sm font-medium text-stone-500">Annotation Groups</p>
          </div>

          <div className={`bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                results.overall_confidence >= 0.85 ? 'bg-emerald-100' :
                results.overall_confidence >= 0.7 ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                <svg className={`w-5 h-5 ${getConfidenceColor(results.overall_confidence)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className={`text-4xl font-bold mb-1 ${getConfidenceColor(results.overall_confidence)}`}>
              {(results.overall_confidence * 100).toFixed(0)}%
            </p>
            <p className="text-sm font-medium text-stone-500">Confidence</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8 mb-10">
          
          {/* Patient Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-6">Patient Information</h2>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Name</p>
                  <p className="text-base font-medium text-stone-800">
                    {results.patient_name || 'Not detected'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Date of Birth</p>
                  <p className="text-base font-medium text-stone-800">
                    {results.patient_dob || 'Not detected'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Form Date</p>
                  <p className="text-base font-medium text-stone-800">
                    {results.form_date || 'Not detected'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Extracted</p>
                  <p className="text-base font-medium text-stone-800">
                    {new Date(results.extraction_timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Page Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-6">Page-by-Page Summary</h2>
              <div className="space-y-3">
                {results.pages.map((page) => (
                  <div
                    key={page.page_number}
                    className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">
                        {page.page_number}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-stone-800">
                          Page {page.page_number}
                        </p>
                        <p className="text-xs text-stone-500">
                          {Object.keys(page.field_values).length} fields, {page.annotation_groups.length} annotations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {page.items_needing_review > 0 && (
                        <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg">
                          {page.items_needing_review} to review
                        </span>
                      )}
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ring-1 ${getConfidenceBg(page.overall_confidence)} ${getConfidenceColor(page.overall_confidence)}`}>
                        {(page.overall_confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Review Items Warning */}
        {results.total_items_needing_review > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-800 text-lg">
                  {results.total_items_needing_review} Items Require Review
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Some extracted data has low confidence or ambiguous content. Please review these items in the downloaded report.
                </p>
                {results.all_review_reasons.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {results.all_review_reasons.slice(0, 3).map((reason, idx) => (
                      <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                    {results.all_review_reasons.length > 3 && (
                      <li className="text-sm text-amber-600 italic pl-3.5">
                        ...and {results.all_review_reasons.length - 3} more in the report
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onDownloadReport}
            disabled={isDownloading}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
              isDownloading 
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed' 
                : 'bg-stone-100 text-amber-600 hover:bg-white hover:shadow-lg hover:shadow-amber-500/20 hover:ring-2 hover:ring-amber-400/40'
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
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-sm text-stone-500 bg-white border border-stone-200 hover:border-stone-300 hover:text-stone-700 hover:shadow-md transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Analyze New Documents</span>
          </button>
        </div>

        {/* Notice */}
        <p className="text-center text-sm text-stone-400 mt-8">
          The findings report has been automatically downloaded to your computer.
          <br />
          Check your downloads folder for the DOCX file.
        </p>
      </main>
    </div>
  );
}
