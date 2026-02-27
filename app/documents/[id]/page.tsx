'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getDocumentDetail,
  reanalyzeDocument,
  type DocumentDetail,
  type PdfFile,
} from '@/lib/api/documents';

type Tab = 'viewer' | 'results' | 'reports' | 'history';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  analyzed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
  processing: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Processing' },
  uploaded: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Uploaded' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
};

function formatDate(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatDuration(ms: number | null) {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

const ACTION_LABELS: Record<string, string> = {
  extraction_started: 'Extraction started',
  extraction_completed: 'Extraction completed',
  document_uploaded: 'Document uploaded',
  report_generated: 'Report generated',
  reanalysis_started: 'Re-analysis started',
};

function PdfViewer({ pdfs }: { pdfs: PdfFile[] }) {
  const [activePdf, setActivePdf] = useState(0);
  const [pageCanvases, setPageCanvases] = useState<HTMLCanvasElement[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPdf = pdfs[activePdf];

  useEffect(() => {
    if (!currentPdf?.url) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function renderPdf() {
      setLoading(true);
      setPageCanvases([]);
      try {
        const pdfData = await fetch(currentPdf.url!).then(r => r.arrayBuffer());
        if (cancelled) return;

        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        if (cancelled) return;
        setNumPages(pdf.numPages);

        const canvases: HTMLCanvasElement[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          canvases.push(canvas);
        }
        if (!cancelled) {
          setPageCanvases(canvases);
        }
      } catch (err) {
        console.error('PDF render error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    renderPdf();
    return () => { cancelled = true; };
  }, [currentPdf?.url]);

  if (pdfs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
        No PDF documents saved for this record.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {pdfs.length > 1 && (
            <select
              value={activePdf}
              onChange={(e) => setActivePdf(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700"
            >
              {pdfs.map((pdf, i) => (
                <option key={pdf.path} value={i}>
                  {pdf.name.replace(/_/g, ' ').replace('.pdf', '')}
                </option>
              ))}
            </select>
          )}
          {pdfs.length === 1 && (
            <span className="text-sm font-medium text-gray-700">
              {currentPdf.name.replace(/_/g, ' ').replace('.pdf', '')}
            </span>
          )}
          {numPages > 0 && (
            <span className="text-xs text-gray-400">{numPages} pages</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            title="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            title="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 text-xs text-gray-500 rounded-md hover:bg-gray-200 transition-colors"
          >
            Fit
          </button>
        </div>
      </div>

      {/* Scrollable pages */}
      <div ref={containerRef} className="overflow-auto max-h-[75vh] bg-gray-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Rendering PDF...</p>
          </div>
        ) : pageCanvases.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Could not load PDF</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-4">
            {pageCanvases.map((canvas, i) => (
              <div key={i} className="shadow-lg bg-white">
                <img
                  src={canvas.toDataURL()}
                  alt={`Page ${i + 1}`}
                  style={{ width: `${zoom * 100}%`, maxWidth: zoom > 1 ? 'none' : '100%' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExtractionResultsPanel({ results }: { results: Array<Record<string, unknown>> }) {
  const [expanded, setExpanded] = useState<number | null>(0);

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
        No extraction results yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((page, i) => {
        const p = page as Record<string, unknown>;
        const fieldValues = (p.field_values ?? {}) as Record<string, Record<string, unknown>>;
        const fields = Object.entries(fieldValues);
        const confidence = Number(p.overall_confidence ?? 0);
        const isOpen = expanded === i;

        return (
          <div key={String(p.page_number)} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full px-5 py-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-900">Page {String(p.page_number)}</h3>
                <span className="text-xs text-gray-400">{fields.length} fields</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${confidence >= 0.8 ? 'bg-emerald-500' : confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">{(confidence * 100).toFixed(0)}%</span>
              </div>
            </button>
            {isOpen && (
              <div className="p-5">
                {fields.length === 0 ? (
                  <p className="text-sm text-gray-400">No fields extracted</p>
                ) : (
                  <div className="grid grid-cols-1 gap-y-1.5">
                    {fields.map(([key, fv]) => (
                      <div key={key} className="flex items-baseline justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-500 truncate max-w-[45%]">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-gray-900 font-medium truncate max-w-[50%] text-right">
                          {String(fv?.value ?? fv?.is_checked ?? '-')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DocumentDetailPage() {
  const { session } = useAuth();
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  const token = session?.access_token;

  const [data, setData] = useState<DocumentDetail | null>(null);
  const [tab, setTab] = useState<Tab>('viewer');
  const [error, setError] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);
  const fetchRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const detail = await getDocumentDetail(docId, token);
      setData(detail);
    } catch {
      setError('Failed to load document');
    }
  }, [docId, token]);

  if (!fetchRef.current && token) {
    fetchRef.current = true;
    load();
  }

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await reanalyzeDocument(docId, token);
      router.push(`/scan?jobId=${res.job_id}`);
    } catch {
      setError('Failed to start re-analysis');
      setReanalyzing(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!data) return;
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: docId,
          form_name: data.document.file_name,
          pages: data.latest_results,
        }),
      });
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${docId.slice(0, 8)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download report');
    }
  };

  if (!data && !error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
        <Link href="/documents" className="text-blue-600 text-sm mt-4 inline-block hover:underline">
          Back to Documents
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const doc = data.document;
  const patient = doc.patient;
  const patientName = patient
    ? `${(patient as Record<string, string>).first_name ?? ''} ${(patient as Record<string, string>).last_name ?? ''}`.trim()
    : 'Unknown Patient';
  const statusStyle = STATUS_STYLES[doc.status] ?? STATUS_STYLES.uploaded;
  const latestJob = data.jobs[0];

  const pdfs = data.pdfs ?? [];
  const results = data.latest_results ?? [];
  const reports = data.reports ?? [];
  const auditLog = data.audit_log ?? [];
  const relatedDocs = data.related_documents ?? [];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'viewer', label: 'Document', count: pdfs.length },
    { key: 'results', label: 'Extracted Data', count: results.length },
    { key: 'reports', label: 'Reports', count: reports.length },
    { key: 'history', label: 'History', count: auditLog.length },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/documents" className="hover:text-gray-900 transition-colors">Documents</Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{patientName}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{patientName}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">{doc.file_name}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
              <span>Created {formatDate(doc.created_at)}</span>
              {doc.total_pages && <span>{doc.total_pages} pages</span>}
              {latestJob?.ai_model_used && <span>Model: {latestJob.ai_model_used}</span>}
              {latestJob?.processing_time_ms && <span>Time: {formatDuration(latestJob.processing_time_ms)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/scan?documentId=${docId}`}
              className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Re-open & Edit
            </Link>
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="px-3.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {reanalyzing ? 'Starting...' : 'Re-analyze'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-blue-400' : 'text-gray-400'}`}>
              ({t.count})
            </span>
          </button>
        ))}
      </div>

      {/* Tab: PDF Viewer */}
      {tab === 'viewer' && <PdfViewer pdfs={pdfs} />}

      {/* Tab: Extracted Data */}
      {tab === 'results' && <ExtractionResultsPanel results={results} />}

      {/* Tab: Reports */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm mb-3">No reports generated yet</p>
              {results.length > 0 && (
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Report
                </button>
              )}
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.report_type === 'extraction_findings' ? 'Findings Report' : r.report_type ?? 'Report'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Generated {formatDate(r.created_at)}</p>
                </div>
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: History */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {auditLog.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No history recorded</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {auditLog.map((entry) => (
                <div key={entry.id} className="px-5 py-3.5 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    entry.action.includes('completed') ? 'bg-emerald-500' :
                    entry.action.includes('started') ? 'bg-blue-500' :
                    entry.action.includes('generated') ? 'bg-indigo-500' :
                    entry.action.includes('uploaded') ? 'bg-gray-400' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {ACTION_LABELS[entry.action] ?? entry.action.replace(/_/g, ' ')}
                    </p>
                    {entry.details && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Object.entries(entry.details)
                          .filter(([k]) => !['document_id'].includes(k))
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Related Documents (Patient Cluster) */}
      {relatedDocs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Other documents for this patient</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
            {relatedDocs.map((rd) => {
              const rdStyle = STATUS_STYLES[rd.status] ?? STATUS_STYLES.uploaded;
              return (
                <Link
                  key={rd.id}
                  href={`/documents/${rd.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rd.file_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {rd.total_pages ? `${rd.total_pages} pages · ` : ''}{formatDate(rd.created_at)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rdStyle.bg} ${rdStyle.text}`}>
                    {rdStyle.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* All Jobs */}
      {data.jobs.length > 1 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">All Extraction Jobs</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-2">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-2">Model</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-2">Duration</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.jobs.map((j) => {
                  const js = STATUS_STYLES[j.status] ?? STATUS_STYLES.uploaded;
                  return (
                    <tr key={j.id}>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${js.bg} ${js.text}`}>
                          {js.label}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-sm text-gray-600">{j.ai_model_used ?? '-'}</td>
                      <td className="px-5 py-2.5 text-sm text-gray-600">{formatDuration(j.processing_time_ms)}</td>
                      <td className="px-5 py-2.5 text-sm text-gray-500">{formatDate(j.completed_at ?? j.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
