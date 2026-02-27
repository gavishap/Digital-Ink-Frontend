'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useCallback } from 'react';
import {
  getDocumentDetail,
  reanalyzeDocument,
  type DocumentDetail,
} from '@/lib/api/documents';

type Tab = 'results' | 'reports' | 'history';

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

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [data, setData] = useState<DocumentDetail | null>(null);
  const [tab, setTab] = useState<Tab>('results');
  const [error, setError] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);
  const fetchRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const detail = await getDocumentDetail(docId);
      setData(detail);
    } catch {
      setError('Failed to load document');
    }
  }, [docId]);

  if (!fetchRef.current) {
    fetchRef.current = true;
    load();
  }

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await reanalyzeDocument(docId);
      router.push(`/scan?jobId=${res.job_id}`);
    } catch {
      setError('Failed to start re-analysis');
      setReanalyzing(false);
    }
  };

  const handleDownloadReport = async (storagePath: string) => {
    if (!data) return;
    const latestJob = data.jobs.find((j) => j.status === 'completed');
    if (!latestJob) return;

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center text-gray-400 text-sm">Loading document...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
        <Link href="/documents" className="text-blue-600 text-sm mt-4 inline-block hover:underline">Back to Documents</Link>
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
      <div className="flex gap-0.5 border-b border-gray-200 mb-6">
        {([
          { key: 'results', label: 'Extraction Results', count: data.latest_results.length },
          { key: 'reports', label: 'Reports', count: data.reports.length },
          { key: 'history', label: 'History', count: data.audit_log.length },
        ] as { key: Tab; label: string; count: number }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
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

      {/* Tab Content: Results */}
      {tab === 'results' && (
        <div className="space-y-4">
          {data.latest_results.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No extraction results yet
            </div>
          ) : (
            data.latest_results.map((page) => {
              const p = page as Record<string, unknown>;
              const fieldValues = (p.field_values ?? {}) as Record<string, Record<string, unknown>>;
              const fields = Object.entries(fieldValues);
              const confidence = Number(p.overall_confidence ?? 0);
              return (
                <div key={String(p.page_number)} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Page {String(p.page_number)}</h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${confidence >= 0.8 ? 'bg-emerald-500' : confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <span className="text-xs text-gray-500">{(confidence * 100).toFixed(0)}% confidence</span>
                    </div>
                  </div>
                  <div className="p-5">
                    {fields.length === 0 ? (
                      <p className="text-sm text-gray-400">No fields extracted</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {fields.slice(0, 20).map(([key, fv]) => (
                          <div key={key} className="flex items-baseline justify-between py-1 border-b border-gray-50">
                            <span className="text-xs text-gray-500 truncate max-w-[45%]">{key.replace(/_/g, ' ')}</span>
                            <span className="text-sm text-gray-900 font-medium truncate max-w-[50%] text-right">
                              {String(fv?.value ?? fv?.is_checked ?? '-')}
                            </span>
                          </div>
                        ))}
                        {fields.length > 20 && (
                          <p className="text-xs text-gray-400 col-span-2 mt-2">
                            +{fields.length - 20} more fields
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content: Reports */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {data.reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm mb-3">No reports generated yet</p>
              {data.latest_results.length > 0 && (
                <button
                  onClick={() => handleDownloadReport('')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Report
                </button>
              )}
            </div>
          ) : (
            data.reports.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.report_type === 'extraction_findings' ? 'Findings Report' : r.report_type ?? 'Report'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Generated {formatDate(r.created_at)}
                    {r.metadata && (r.metadata as Record<string, unknown>).original_filename && (
                      <> &middot; {String((r.metadata as Record<string, unknown>).original_filename)}</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadReport(r.storage_path ?? '')}
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

      {/* Tab Content: History */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {data.audit_log.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No history recorded</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.audit_log.map((entry) => (
                <div key={entry.id} className="px-5 py-3.5 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    entry.action.includes('completed') ? 'bg-emerald-500' :
                    entry.action.includes('started') ? 'bg-blue-500' :
                    entry.action.includes('generated') ? 'bg-indigo-500' :
                    entry.action.includes('uploaded') ? 'bg-gray-400' :
                    'bg-gray-300'
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

      {/* Jobs Summary */}
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
