'use client';

import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MultiDocumentAnnotator } from '@/components/pdf/MultiDocumentAnnotator';
import { AnalysisResultsView } from '@/components/document/AnalysisResultsView';
import {
  analyzeDocumentImages,
  pollJobStatus,
  getResults,
  saveAnnotatedPdfs,
  type ExtractionResult,
  type JobStatus,
} from '@/lib/api/extraction';

const DEFAULT_DOCUMENTS = [
  {
    id: 'orofacial',
    name: 'Orofacial Pain Examination',
    pdfUrl: '/orofacial-exam.pdf',
  },
  {
    id: 'consents',
    name: 'Consents',
    pdfUrl: '/consents.pdf',
  },
];

type AppState = 'annotating' | 'analyzing' | 'results' | 'error';

interface AnnotatedPage {
  pageNumber: number;
  documentId: string;
  documentName: string;
  blob: Blob;
}

interface AnnotatedPdf {
  documentId: string;
  documentName: string;
  blob: Blob;
}

interface SaveAndAnalyzeData {
  annotatedPages: Map<string, AnnotatedPage[]>;
  completePdfs: AnnotatedPdf[];
}

interface PageMetadata {
  originalPageNumber: number;
  documentId: string;
  documentName: string;
}

export default function ScanPage() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get('documentId');

  const [appState, setAppState] = useState<AppState>('annotating');
  const [analysisProgress, setAnalysisProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
    stage?: string;
  } | null>(null);
  const [results, setResults] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSaveAndAnalyze = useCallback(async (data: SaveAndAnalyzeData) => {
    try {
      setAppState('analyzing');
      setError(null);

      const { annotatedPages: documentPages, completePdfs } = data;

      let totalPages = 0;
      const allBlobs: Blob[] = [];
      const pageMetadata: PageMetadata[] = [];

      for (const [, pages] of documentPages.entries()) {
        for (const { pageNumber, documentId: docId, documentName, blob } of pages) {
          allBlobs.push(blob);
          pageMetadata.push({
            originalPageNumber: pageNumber,
            documentId: docId,
            documentName,
          });
          totalPages++;
        }
      }

      if (totalPages === 0) {
        setError('No pages have been annotated. Please draw on at least one page before analyzing.');
        setAppState('error');
        return;
      }

      setAnalysisProgress({ current: 0, total: totalPages, percentage: 0, stage: 'Uploading to AI engine...' });

      const { job_id, document_id } = await analyzeDocumentImages(allBlobs, {
        name: 'Patient Forms - Combined',
        pageMetadata,
      });

      if (completePdfs.length > 0) {
        setAnalysisProgress({ current: 0, total: totalPages, percentage: 0, stage: 'Saving complete documents...' });
        try {
          await saveAnnotatedPdfs(
            completePdfs.map(pdf => ({
              documentName: pdf.documentName,
              blob: pdf.blob,
            })),
            { jobId: job_id, documentId: document_id },
          );
        } catch (saveErr) {
          console.error('[PDF SAVE] Error saving PDFs:', saveErr);
        }
      }

      const onProgress = (status: JobStatus) => {
        const progress = status.progress || 0;
        const total = status.total_pages || totalPages;
        const percentage = status.percentage || (total > 0 ? Math.round((progress / total) * 100) : 0);
        setAnalysisProgress({
          current: progress,
          total,
          percentage,
          stage: status.current_stage || 'Analyzing...',
        });
      };

      const finalStatus = await pollJobStatus(job_id, onProgress);

      if (finalStatus.status === 'failed') {
        throw new Error(finalStatus.message || 'Analysis failed');
      }

      setAnalysisProgress({ current: totalPages, total: totalPages, percentage: 100, stage: 'Retrieving results...' });
      const extractionResults = await getResults(job_id);

      setResults(extractionResults);
      setAppState('results');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setAppState('error');
    }
  }, []);

  const handleDownloadReport = useCallback(async () => {
    if (!results) return;
    setIsDownloading(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      });
      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${results.form_name || 'findings'}_report.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  }, [results]);

  const handleStartOver = useCallback(() => {
    setAppState('annotating');
    setResults(null);
    setError(null);
    setAnalysisProgress(null);
  }, []);

  if (appState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleStartOver}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (appState === 'results' && results) {
    return (
      <AnalysisResultsView
        results={results}
        onDownloadReport={handleDownloadReport}
        onStartOver={handleStartOver}
        isDownloading={isDownloading}
      />
    );
  }

  return (
    <MultiDocumentAnnotator
      documents={documentId ? [] : DEFAULT_DOCUMENTS}
      onSaveAndAnalyze={handleSaveAndAnalyze}
      isAnalyzing={appState === 'analyzing'}
      analysisProgress={analysisProgress || undefined}
    />
  );
}
