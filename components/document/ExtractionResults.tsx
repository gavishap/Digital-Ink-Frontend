'use client';

import React, { useState } from 'react';
import type { ExtractionResult, PageResult, AnnotationGroup } from '@/lib/api/extraction';

interface ExtractionResultsProps {
  results: ExtractionResult;
  onGenerateReport?: () => void;
  isGeneratingReport?: boolean;
}

export function ExtractionResults({
  results,
  onGenerateReport,
  isGeneratingReport = false,
}: ExtractionResultsProps) {
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['patient-info', 'summary'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const currentPage = results.pages.find(p => p.page_number === selectedPage);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Extraction Results</h2>
            <p className="text-blue-100 text-sm mt-1">
              {results.form_name} - {results.pages.length} page{results.pages.length > 1 ? 's' : ''}
            </p>
          </div>
          
          {onGenerateReport && (
            <button
              onClick={onGenerateReport}
              disabled={isGeneratingReport}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm
                ${isGeneratingReport
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
                }
              `}
            >
              {isGeneratingReport ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                'Download Report'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Patient Info Section */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleSection('patient-info')}
          className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Patient Information</span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expandedSections.has('patient-info') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.has('patient-info') && (
          <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
              <p className="text-sm font-medium text-gray-900">{results.patient_name || 'Not detected'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
              <p className="text-sm font-medium text-gray-900">{results.patient_dob || 'Not detected'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Form Date</p>
              <p className="text-sm font-medium text-gray-900">{results.form_date || 'Not detected'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Extracted</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(results.extraction_timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Summary</span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              expandedSections.has('summary') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.has('summary') && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Overall Confidence</p>
                <div className="flex items-center mt-1">
                  <span className={`text-2xl font-bold ${getConfidenceColor(results.overall_confidence).split(' ')[0]}`}>
                    {(results.overall_confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Pages</p>
                <p className="text-2xl font-bold text-gray-900">{results.pages.length}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Items for Review</p>
                <p className={`text-2xl font-bold ${
                  results.total_items_needing_review > 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {results.total_items_needing_review}
                </p>
              </div>
            </div>
            
            {results.all_review_reasons.length > 0 && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="text-sm font-medium text-orange-800 mb-2">Review Needed</h4>
                <ul className="space-y-1">
                  {results.all_review_reasons.slice(0, 5).map((reason, idx) => (
                    <li key={idx} className="text-sm text-orange-700 flex items-start">
                      <span className="mr-2">-</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                  {results.all_review_reasons.length > 5 && (
                    <li className="text-sm text-orange-600 italic">
                      ...and {results.all_review_reasons.length - 5} more items
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Page Navigator */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-sm text-gray-600 whitespace-nowrap">Page:</span>
          {results.pages.map(page => (
            <button
              key={page.page_number}
              onClick={() => setSelectedPage(page.page_number)}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-colors
                ${selectedPage === page.page_number
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              {page.page_number}
            </button>
          ))}
        </div>
      </div>

      {/* Page Details */}
      {currentPage && (
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Page {currentPage.page_number} Details
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(currentPage.overall_confidence)}`}>
              {(currentPage.overall_confidence * 100).toFixed(0)}% confident
            </span>
          </div>

          {/* Field Values */}
          {Object.keys(currentPage.field_values).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Extracted Fields ({Object.keys(currentPage.field_values).length})
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Conf.</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(currentPage.field_values).slice(0, 20).map(([fieldId, value]) => (
                      <tr key={fieldId} className={value.has_correction ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-2 text-sm text-gray-900 font-mono">{fieldId}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {value.is_checked !== undefined
                            ? (value.is_checked ? 'Yes' : 'No')
                            : value.value || '-'
                          }
                          {value.has_correction && (
                            <span className="ml-2 text-xs text-yellow-600">(corrected)</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(value.confidence)}`}>
                            {(value.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {Object.keys(currentPage.field_values).length > 20 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 text-center italic">
                          ...and {Object.keys(currentPage.field_values).length - 20} more fields
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Annotation Groups */}
          {currentPage.annotation_groups.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Annotation Groups ({currentPage.annotation_groups.length})
              </h4>
              <div className="space-y-3">
                {currentPage.annotation_groups.map((group: AnnotationGroup) => (
                  <div key={group.group_id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">{group.interpretation}</p>
                    {group.clinical_significance && (
                      <p className="text-xs text-blue-700 mt-2 italic">
                        Clinical: {group.clinical_significance}
                      </p>
                    )}
                    {group.note && (
                      <p className="text-xs text-blue-600 mt-1">Note: {group.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Free-form Annotations */}
          {currentPage.free_form_annotations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Free-form Notes ({currentPage.free_form_annotations.length})
              </h4>
              <div className="space-y-2">
                {currentPage.free_form_annotations.map((annotation, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      annotation.needs_review
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <p className="text-sm text-gray-900">"{annotation.text_content}"</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Location: {annotation.location_description}
                    </p>
                    {annotation.interpretation && (
                      <p className="text-xs text-gray-600 mt-1">
                        Interpretation: {annotation.interpretation}
                      </p>
                    )}
                    {annotation.needs_review && annotation.review_reason && (
                      <p className="text-xs text-orange-600 mt-1">
                        Review: {annotation.review_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Items */}
          {currentPage.review_reasons.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="text-sm font-medium text-orange-800 mb-2">
                Items Requiring Review ({currentPage.items_needing_review})
              </h4>
              <ul className="space-y-1">
                {currentPage.review_reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm text-orange-700 flex items-start">
                    <span className="mr-2">-</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
