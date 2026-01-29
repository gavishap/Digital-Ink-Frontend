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
    if (confidence >= 0.85) return 'bg-emerald-50 ring-1 ring-emerald-200';
    if (confidence >= 0.7) return 'bg-amber-50 ring-1 ring-amber-200';
    return 'bg-red-50 ring-1 ring-red-200';
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
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100">
      {/* Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-stone-200/60 shadow-sm">
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">Analysis Complete</h1>
              <p className="text-sm sm:text-base text-stone-500 mt-1">Your documents have been processed successfully</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-stone-800 mb-2">{results.pages.length}</p>
            <p className="text-sm font-medium text-stone-500">Pages Analyzed</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-stone-800 mb-2">{totalFields}</p>
            <p className="text-sm font-medium text-stone-500">Fields Extracted</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-stone-800 mb-2">{totalAnnotations}</p>
            <p className="text-sm font-medium text-stone-500">Annotation Groups</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              results.overall_confidence >= 0.85 ? 'bg-emerald-100' :
              results.overall_confidence >= 0.7 ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              <svg className={`w-6 h-6 ${getConfidenceColor(results.overall_confidence)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`text-4xl sm:text-5xl font-bold mb-2 ${getConfidenceColor(results.overall_confidence)}`}>
              {(results.overall_confidence * 100).toFixed(0)}%
            </p>
            <p className="text-sm font-medium text-stone-500">Confidence</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          
          {/* Patient Info - Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-8 h-full">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-8">Patient Information</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Name</p>
                  <p className="text-lg font-semibold text-stone-800">
                    {results.patient_name || 'Not detected'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Date of Birth</p>
                  <p className="text-lg font-semibold text-stone-800">
                    {results.patient_dob || 'Not detected'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Form Date</p>
                  <p className="text-lg font-semibold text-stone-800">
                    {results.form_date || 'Not detected'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Extracted</p>
                  <p className="text-lg font-semibold text-stone-800">
                    {new Date(results.extraction_timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Page Summary - Right Column */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-8 h-full">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-8">Page-by-Page Summary</h2>
              <div className="space-y-4">
                {results.pages.map((page) => (
                  <div
                    key={page.page_number}
                    className="flex items-center justify-between p-5 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <span className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-xl flex items-center justify-center text-base font-bold shadow-sm flex-shrink-0">
                        {page.page_number}
                      </span>
                      <div>
                        <p className="text-base font-semibold text-stone-800">
                          Page {page.page_number}
                        </p>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {Object.keys(page.field_values).length} fields, {page.annotation_groups.length} annotations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {page.items_needing_review > 0 && (
                        <span className="px-4 py-2 bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg whitespace-nowrap">
                          {page.items_needing_review} to review
                        </span>
                      )}
                      <span className={`px-4 py-2 rounded-lg text-sm font-bold ${getConfidenceBg(page.overall_confidence)} ${getConfidenceColor(page.overall_confidence)}`}>
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
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 mb-12">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-amber-800 text-xl">
                  {results.total_items_needing_review} Items Require Review
                </h3>
                <p className="text-base text-amber-700 mt-2">
                  Some extracted data has low confidence or ambiguous content. Please review these items in the downloaded report.
                </p>
                {results.all_review_reasons.length > 0 && (
                  <ul className="mt-5 space-y-3">
                    {results.all_review_reasons.slice(0, 3).map((reason, idx) => (
                      <li key={idx} className="text-sm text-amber-700 flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                    {results.all_review_reasons.length > 3 && (
                      <li className="text-sm text-amber-600 italic ml-5">
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
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button
            onClick={onDownloadReport}
            disabled={isDownloading}
            className={`w-full sm:w-auto flex items-center justify-center gap-4 px-10 py-5 rounded-2xl font-semibold text-base transition-all duration-200 ${
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
            className="w-full sm:w-auto flex items-center justify-center gap-4 px-10 py-5 rounded-2xl font-semibold text-base text-stone-500 bg-white border-2 border-stone-200 hover:border-stone-300 hover:text-stone-700 hover:shadow-md transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Analyze New Documents</span>
          </button>
        </div>

        {/* Notice */}
        <p className="text-center text-base text-stone-400 mt-10 leading-relaxed">
          The findings report has been automatically downloaded to your computer.
          <br />
          Check your downloads folder for the DOCX file.
        </p>
      </main>
    </div>
  );
}
