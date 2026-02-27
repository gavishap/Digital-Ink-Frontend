'use client';

import React, { useState, useCallback } from 'react';
import { DocumentUpload, DocumentViewer, ExtractionResults, FindingsReport } from '@/components/document';
import {
  analyzeDocument,
  pollJobStatus,
  getResults,
  type JobStatus,
  type ExtractionResult,
} from '@/lib/api/extraction';

type AnalysisState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export default function AnalyzePage() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [results, setResults] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Handle file selection
  const handleFileSelected = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setResults(null);
    setJobStatus(null);
    setError(null);
    setAnalysisState('idle');
  }, []);

  // Remove selected file
  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setResults(null);
    setJobStatus(null);
    setError(null);
    setAnalysisState('idle');
  }, []);

  // Start analysis
  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    try {
      setAnalysisState('uploading');
      setError(null);

      // Start analysis
      const response = await analyzeDocument(file);
      
      setAnalysisState('processing');

      // Poll for completion
      const finalStatus = await pollJobStatus(
        response.job_id,
        (status) => {
          setJobStatus(status);
        },
        2000, // Poll every 2 seconds
        300   // Max 10 minutes
      );

      if (finalStatus.status === 'completed') {
        // Get full results
        const extractionResults = await getResults(finalStatus.job_id);
        setResults(extractionResults);
        setAnalysisState('completed');
      } else {
        throw new Error(finalStatus.message || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAnalysisState('error');
    }
  }, [file]);

  // Generate DOCX report
  const handleGenerateReport = useCallback(async () => {
    if (!results) return;

    try {
      setIsGeneratingReport(true);

      // Call the report generation API
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(results),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${results.form_name}_findings_report.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [results]);

  // Reset to start over
  const handleReset = useCallback(() => {
    setFile(null);
    setResults(null);
    setJobStatus(null);
    setError(null);
    setAnalysisState('idle');
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Document Analysis</h1>
                <p className="text-sm text-gray-500">AI-powered medical form extraction</p>
              </div>
            </div>
            
            {analysisState === 'completed' && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Analyze Another
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Upload Section - Show when no file or no results */}
        {!file && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Upload a Document</h2>
              <p className="text-gray-600 mt-2">
                Upload a filled medical form (PDF or image) to extract data using AI
              </p>
            </div>
            <DocumentUpload onFileSelected={handleFileSelected} />
            
            {/* Instructions */}
            <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">How it works</h3>
              <ol className="space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <span className="text-gray-600">Upload a filled medical form (PDF or image)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <span className="text-gray-600">Our AI analyzes the document using 6-stage extraction</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <span className="text-gray-600">Review extracted data, annotations, and items needing attention</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <span className="text-gray-600">Download a detailed findings report as a Word document</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* File Selected - Show preview and analyze button */}
        {file && !results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Preview */}
            <div>
              <DocumentViewer file={file} onRemove={handleRemoveFile} />
            </div>

            {/* Analysis Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ready to Analyze</h2>
              
              {/* Status */}
              {analysisState === 'idle' && (
                <div className="mb-6">
                  <p className="text-gray-600">
                    Click the button below to start AI-powered extraction. This will:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Detect all visual elements and handwriting</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Extract and transcribe text with OCR</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Analyze spatial relationships and connections</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Interpret clinical annotations semantically</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Validate and flag items needing review</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Processing Status */}
              {(analysisState === 'uploading' || analysisState === 'processing') && jobStatus && (
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="font-medium text-blue-600">
                      {jobStatus.current_stage || 'Processing...'}
                    </span>
                  </div>
                  
                  {jobStatus.total_pages && (
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{jobStatus.progress || 0} / {jobStatus.total_pages} pages</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((jobStatus.progress || 0) / jobStatus.total_pages) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500 mt-3">
                    {jobStatus.message || 'Analyzing document with AI...'}
                  </p>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={analysisState === 'uploading' || analysisState === 'processing'}
                className={`
                  w-full py-3 px-4 rounded-lg font-medium text-white
                  flex items-center justify-center space-x-2
                  ${(analysisState === 'uploading' || analysisState === 'processing')
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }
                  transition-colors
                `}
              >
                {(analysisState === 'uploading' || analysisState === 'processing') ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Analyze Document</span>
                  </>
                )}
              </button>

              {/* Estimated time */}
              {analysisState === 'idle' && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  Estimated time: 2-5 minutes depending on document size
                </p>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Results Display */}
            <ExtractionResults
              results={results}
              onGenerateReport={handleGenerateReport}
              isGeneratingReport={isGeneratingReport}
            />

            {/* Findings Report Generator */}
            <FindingsReport
              results={results}
              isGenerating={isGeneratingReport}
              onGenerate={handleGenerateReport}
            />
          </div>
        )}
      </main>
    </div>
  );
}
