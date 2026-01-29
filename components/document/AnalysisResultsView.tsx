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
    <div 
      style={{ 
        minHeight: '100vh', 
        width: '100%',
        background: 'linear-gradient(to bottom right, #f5f5f4, #fffbeb, #f5f5f4)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <header 
        style={{ 
          width: '100%', 
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderBottom: '1px solid #e7e5e4',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div 
              style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px',
                background: 'linear-gradient(to bottom right, #10b981, #059669)',
                boxShadow: '0 10px 15px rgba(16,185,129,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg style={{ width: '28px', height: '28px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#292524', margin: 0 }}>Analysis Complete</h1>
              <p style={{ fontSize: '16px', color: '#78716c', marginTop: '4px' }}>Your documents have been processed successfully</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px' }}>
        
        {/* Stats Grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '24px', 
            marginBottom: '48px' 
          }}
        >
          {/* Pages Analyzed */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '24px',
            border: '1px solid #e7e5e4',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              backgroundColor: '#f5f5f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <svg style={{ width: '24px', height: '24px', color: '#57534e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p style={{ fontSize: '48px', fontWeight: 700, color: '#292524', margin: 0 }}>{results.pages.length}</p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#78716c', marginTop: '8px' }}>Pages Analyzed</p>
          </div>

          {/* Fields Extracted */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '24px',
            border: '1px solid #e7e5e4',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <svg style={{ width: '24px', height: '24px', color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <p style={{ fontSize: '48px', fontWeight: 700, color: '#292524', margin: 0 }}>{totalFields}</p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#78716c', marginTop: '8px' }}>Fields Extracted</p>
          </div>

          {/* Annotation Groups */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '24px',
            border: '1px solid #e7e5e4',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              backgroundColor: '#f5f5f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <svg style={{ width: '24px', height: '24px', color: '#57534e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p style={{ fontSize: '48px', fontWeight: 700, color: '#292524', margin: 0 }}>{totalAnnotations}</p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#78716c', marginTop: '8px' }}>Annotation Groups</p>
          </div>

          {/* Confidence */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '24px',
            border: '1px solid #e7e5e4',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              backgroundColor: results.overall_confidence >= 0.85 ? '#d1fae5' : results.overall_confidence >= 0.7 ? '#fef3c7' : '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <svg style={{ width: '24px', height: '24px', color: results.overall_confidence >= 0.85 ? '#059669' : results.overall_confidence >= 0.7 ? '#d97706' : '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p style={{ 
              fontSize: '48px', 
              fontWeight: 700, 
              margin: 0,
              color: results.overall_confidence >= 0.85 ? '#059669' : results.overall_confidence >= 0.7 ? '#d97706' : '#dc2626',
            }}>
              {(results.overall_confidence * 100).toFixed(0)}%
            </p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#78716c', marginTop: '8px' }}>Confidence</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '32px', marginBottom: '48px' }}>
          
          {/* Patient Info */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '32px',
            border: '1px solid #e7e5e4',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a8a29e', marginBottom: '32px' }}>Patient Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a8a29e', marginBottom: '8px' }}>Name</p>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#292524', margin: 0 }}>{results.patient_name || 'Not detected'}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a8a29e', marginBottom: '8px' }}>Date of Birth</p>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#292524', margin: 0 }}>{results.patient_dob || 'Not detected'}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a8a29e', marginBottom: '8px' }}>Form Date</p>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#292524', margin: 0 }}>{results.form_date || 'Not detected'}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a8a29e', marginBottom: '8px' }}>Extracted</p>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#292524', margin: 0 }}>{new Date(results.extraction_timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Page Summary */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '32px',
            border: '1px solid #e7e5e4',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a8a29e', marginBottom: '32px' }}>Page-by-Page Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {results.pages.map((page) => (
                <div
                  key={page.page_number}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '20px',
                    backgroundColor: '#fafaf9',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ 
                      width: '48px', 
                      height: '48px', 
                      background: 'linear-gradient(to bottom right, #fbbf24, #f59e0b)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '16px',
                      boxShadow: '0 2px 4px rgba(245,158,11,0.3)',
                    }}>
                      {page.page_number}
                    </span>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#292524', margin: 0 }}>Page {page.page_number}</p>
                      <p style={{ fontSize: '14px', color: '#78716c', marginTop: '4px' }}>
                        {Object.keys(page.field_values).length} fields, {page.annotation_groups.length} annotations
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {page.items_needing_review > 0 && (
                      <span style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#fef3c7', 
                        color: '#b45309',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '8px',
                      }}>
                        {page.items_needing_review} to review
                      </span>
                    )}
                    <span style={{ 
                      padding: '8px 16px', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      backgroundColor: page.overall_confidence >= 0.85 ? '#d1fae5' : page.overall_confidence >= 0.7 ? '#fef3c7' : '#fee2e2',
                      color: page.overall_confidence >= 0.85 ? '#059669' : page.overall_confidence >= 0.7 ? '#d97706' : '#dc2626',
                    }}>
                      {(page.overall_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Review Items Warning */}
        {results.total_items_needing_review > 0 && (
          <div style={{ 
            backgroundColor: '#fffbeb', 
            border: '1px solid #fde68a', 
            borderRadius: '16px', 
            padding: '32px',
            marginBottom: '48px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#92400e', margin: 0 }}>
                  {results.total_items_needing_review} Items Require Review
                </h3>
                <p style={{ fontSize: '16px', color: '#b45309', marginTop: '8px' }}>
                  Some extracted data has low confidence or ambiguous content. Please review these items in the downloaded report.
                </p>
                {results.all_review_reasons.length > 0 && (
                  <ul style={{ marginTop: '20px', listStyle: 'none', padding: 0 }}>
                    {results.all_review_reasons.slice(0, 3).map((reason, idx) => (
                      <li key={idx} style={{ fontSize: '14px', color: '#b45309', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24', marginTop: '6px', flexShrink: 0 }}></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                    {results.all_review_reasons.length > 3 && (
                      <li style={{ fontSize: '14px', color: '#d97706', fontStyle: 'italic', marginLeft: '20px' }}>
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '32px' }}>
          <button
            onClick={onDownloadReport}
            disabled={isDownloading}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '20px 40px',
              borderRadius: '16px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              backgroundColor: '#f5f5f4',
              color: isDownloading ? '#a8a29e' : '#d97706',
              transition: 'all 0.2s',
            }}
          >
            {isDownloading ? (
              <>
                <svg style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Report Again</span>
              </>
            )}
          </button>

          <button
            onClick={onStartOver}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '20px 40px',
              borderRadius: '16px',
              border: '2px solid #e7e5e4',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: 'white',
              color: '#78716c',
              transition: 'all 0.2s',
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Analyze New Documents</span>
          </button>
        </div>

        {/* Notice */}
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#a8a29e', lineHeight: 1.6 }}>
          The findings report has been automatically downloaded to your computer.
          <br />
          Check your downloads folder for the DOCX file.
        </p>
      </main>
    </div>
  );
}
