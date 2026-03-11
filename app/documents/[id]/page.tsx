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
import { getReportDownloadUrl } from '@/lib/api/patients';
import { generateClinicalReport } from '@/lib/api/extraction';

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

interface PageImage {
  page_number: number;
  image_url: string | null;
}

function PdfViewer({ pdfs, pages }: { pdfs: PdfFile[]; pages?: PageImage[] }) {
  const [activePdf, setActivePdf] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const currentPdf = pdfs[activePdf];

  useEffect(() => {
    if (!currentPdf?.url) {
      setBlobUrl(null);
      return;
    }
    let revoke = '';
    setLoading(true);
    fetch(currentPdf.url)
      .then(r => r.blob())
      .then(blob => {
        revoke = URL.createObjectURL(blob);
        setBlobUrl(revoke);
      })
      .catch(() => setBlobUrl(null))
      .finally(() => setLoading(false));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [currentPdf?.url]);

  const validPages = pages?.filter(p => p.image_url) ?? [];

  if (pdfs.length === 0 && validPages.length > 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Scanned Pages</span>
          <span className="text-xs text-gray-400">{validPages.length} pages</span>
        </div>
        <div className="overflow-y-auto space-y-4 p-4 bg-gray-50" style={{ maxHeight: '70vh' }}>
          {validPages.map((p) => (
            <div key={p.page_number} className="relative">
              <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full z-10">
                Page {p.page_number}
              </span>
              <img
                src={p.image_url!}
                alt={`Page ${p.page_number}`}
                className="w-full rounded-lg shadow-sm border border-gray-200"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (pdfs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
        No documents saved for this record.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {pdfs.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <span className="text-xs text-gray-500">Viewing:</span>
          {pdfs.map((pdf, i) => (
            <button
              key={pdf.path}
              onClick={() => setActivePdf(i)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                i === activePdf
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pdf.name.replace(/_/g, ' ').replace('.pdf', '')}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3" style={{ height: '75vh' }}>
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading PDF...</p>
        </div>
      ) : blobUrl ? (
        <iframe
          key={blobUrl}
          src={blobUrl}
          className="w-full border-0"
          style={{ height: '75vh' }}
          title={currentPdf?.name ?? 'PDF'}
        />
      ) : (
        <div className="flex items-center justify-center" style={{ height: '75vh' }}>
          <p className="text-sm text-gray-400">PDF not available</p>
        </div>
      )}
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

  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!data) return;
    setGenerating(true);
    try {
      await generateClinicalReport({ document_id: docId });
      await load();
      setTab('reports');
    } catch {
      setError('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleReportDownload = async (reportId: string) => {
    try {
      const { download_url } = await getReportDownloadUrl(reportId);
      window.open(download_url, '_blank');
    } catch {
      setError('Failed to get download link');
    }
  };

  const handleReportPrint = async (reportId: string) => {
    try {
      const { download_url } = await getReportDownloadUrl(reportId);
      const w = window.open(download_url, '_blank');
      if (w) w.addEventListener('load', () => w.print());
    } catch {
      setError('Failed to open for printing');
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

  const viewablePages = (data.pages ?? []).filter(p => p.image_url);
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'viewer', label: 'Document', count: pdfs.length || viewablePages.length },
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
              href={`/scan?documentId=${docId}${doc.patient_id ? `&patientId=${doc.patient_id}` : ''}`}
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
      {tab === 'viewer' && <PdfViewer pdfs={pdfs} pages={data.pages} />}

      {/* Tab: Extracted Data */}
      {tab === 'results' && <ExtractionResultsPanel results={results} />}

      {/* Tab: Reports */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {results.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {generating ? 'Generating...' : 'Generate New Report'}
              </button>
            </div>
          )}
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">No reports generated yet</p>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReportDownload(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={() => handleReportPrint(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.159 48.159 0 018.5 0m-8.5 0V6.375a2.25 2.25 0 012.25-2.25h3.5a2.25 2.25 0 012.25 2.25V6.7" />
                    </svg>
                    Print
                  </button>
                </div>
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
