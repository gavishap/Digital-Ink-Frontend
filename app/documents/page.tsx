'use client';

import Link from 'next/link';
import { useState, useRef, useCallback } from 'react';
import { listDocuments, type DocumentListItem } from '@/lib/api/documents';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  analyzed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
  processing: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Processing' },
  uploaded: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Uploaded' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.uploaded;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function formatDate(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const fetchRef = useRef(false);

  const load = useCallback(async (s?: string, st?: string) => {
    try {
      const res = await listDocuments({
        search: s ?? search,
        status: st ?? statusFilter || undefined,
        limit: 50,
      });
      setDocs(res.documents);
      setTotal(res.total);
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoaded(true);
    }
  }, [search, statusFilter]);

  if (!fetchRef.current) {
    fetchRef.current = true;
    load();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total documents</p>
        </div>
        <Link
          href="/scan"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Scan
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by patient name or file name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              load(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            load(search, e.target.value);
          }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
        >
          <option value="">All statuses</option>
          <option value="analyzed">Completed</option>
          <option value="processing">Processing</option>
          <option value="uploaded">Uploaded</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Patient / Document</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Pages</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Reports</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!loaded ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Loading documents...</td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-400 text-sm">No documents found</p>
                      <Link href="/scan" className="text-blue-600 text-sm hover:underline">Start a new scan</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-gray-50/80 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/documents/${doc.id}`} className="block">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {doc.patient_name || 'Unknown Patient'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]">{doc.file_name}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{doc.total_pages ?? '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{doc.report_count}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-500">{formatDate(doc.created_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
