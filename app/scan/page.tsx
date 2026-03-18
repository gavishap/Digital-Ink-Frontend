'use client';

import React, { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { MultiDocumentAnnotator } from '@/components/pdf/MultiDocumentAnnotator';
import { getDocumentDetail } from '@/lib/api/documents';
import {
  analyzeDocumentImages,
  pollJobStatus,
  getResults,
  saveAnnotatedPdfs,
  generateClinicalReport,
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

type AppState = 'loading' | 'annotating' | 'analyzing' | 'error';

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
  const router = useRouter();
  const documentId = searchParams.get('documentId');
  const patientId = searchParams.get('patientId');
  const { session } = useAuth();
  const token = session?.access_token;

  const patientIdRef = useRef(patientId);
  patientIdRef.current = patientId;
  const documentIdRef = useRef(documentId);
  documentIdRef.current = documentId;

  const [appState, setAppState] = useState<AppState>(documentId ? 'loading' : 'annotating');
  const [loadedDocs, setLoadedDocs] = useState<{ id: string; name: string; pdfUrl: string }[] | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
    stage?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(false);

  if (documentId && token && !fetchRef.current) {
    fetchRef.current = true;
    getDocumentDetail(documentId, token)
      .then((detail) => {
        const pdfs = detail.pdfs ?? [];
        if (pdfs.length > 0) {
          setLoadedDocs(
            pdfs.filter(p => p.url).map((p, i) => ({
              id: `reopen-${i}`,
              name: p.name.replace(/_/g, ' ').replace('.pdf', ''),
              pdfUrl: p.url!,
            }))
          );
        } else {
          setLoadedDocs(DEFAULT_DOCUMENTS);
        }
        setAppState('annotating');
      })
      .catch(() => {
        setLoadedDocs(DEFAULT_DOCUMENTS);
        setAppState('annotating');
      });
  }

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
        setError('No document pages found. Please ensure documents are loaded.');
        setAppState('error');
        return;
      }

      setAnalysisProgress({ current: 0, total: totalPages, percentage: 0, stage: 'Uploading to AI engine...' });

      const { job_id, document_id: newDocId } = await analyzeDocumentImages(allBlobs, {
        name: 'Patient Forms - Combined',
        schemaPath: 'templates/orofacial_exam_schema.json',
        pageMetadata,
        parentDocumentId: documentIdRef.current || undefined,
        patientId: patientIdRef.current || undefined,
      });

      if (completePdfs.length > 0) {
        setAnalysisProgress({ current: 0, total: totalPages, percentage: 0, stage: 'Saving complete documents...' });
        try {
          await saveAnnotatedPdfs(
            completePdfs.map(pdf => ({
              documentName: pdf.documentName,
              blob: pdf.blob,
            })),
            { jobId: job_id, documentId: newDocId },
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

      setAnalysisProgress({ current: totalPages, total: totalPages, percentage: 100, stage: 'Generating report...' });

      try {
        await generateClinicalReport({ job_id });
      } catch (reportErr) {
        console.error('Auto-report generation failed (non-blocking):', reportErr);
      }

      const pid = patientIdRef.current;
      if (pid) {
        router.push(`/patients/${pid}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setAppState('error');
    }
  }, [router]);

  const handleStartOver = useCallback(() => {
    setAppState('annotating');
    setError(null);
    setAnalysisProgress(null);
  }, []);

  if (!patientId && !documentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Patient Required</h2>
          <p className="text-gray-600 mb-6">Please select a patient first before starting a new scan.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Go to Patients
          </Link>
        </div>
      </div>
    );
  }

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading document...</p>
        </div>
      </div>
    );
  }

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

  const documents = loadedDocs ?? DEFAULT_DOCUMENTS;

  return (
    <MultiDocumentAnnotator
      documents={documents}
      onSaveAndAnalyze={handleSaveAndAnalyze}
      isAnalyzing={appState === 'analyzing'}
      analysisProgress={analysisProgress || undefined}
    />
  );
}
