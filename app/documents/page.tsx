'use client';

import Link from 'next/link';
import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { listDocuments, type DocumentListItem } from '@/lib/api/documents';
import { StatusBadge, formatDateLong } from '@/lib/design';

export default function DocumentsPage() {
  const { session } = useAuth();
  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const fetchRef = useRef(false);
  const token = session?.access_token;

  const load = useCallback(async (s?: string, st?: string) => {
    try {
      const res = await listDocuments({
        search: s ?? search,
        status: (st ?? statusFilter) || undefined,
        limit: 50,
        token,
      });
      setDocs(res.documents);
      setTotal(res.total);
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoaded(true);
    }
  }, [search, statusFilter, token]);

  if (!fetchRef.current && token) {
    fetchRef.current = true;
    load();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Documents</h1>
        <p className="text-slate-500 mt-1.5 text-[15px]">
          <span className="font-semibold text-slate-700">{total}</span> documents in your workspace
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up stagger-2">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
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
            className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            load(search, e.target.value);
          }}
          className="px-4 py-3 text-sm bg-white border border-slate-200 rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-700 transition-all duration-200 hover:border-slate-300"
        >
          <option value="">All statuses</option>
          <option value="analyzed">Completed</option>
          <option value="processing">Processing</option>
          <option value="uploaded">Uploaded</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-5 text-sm text-rose-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden animate-slide-up stagger-3">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display">Document</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display">Patient</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display">Status</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display hidden md:table-cell">Pages</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display hidden md:table-cell">Reports</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loaded ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-400 text-sm">Loading documents...</p>
                    </div>
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center">
                        <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-slate-500 text-sm font-medium">No documents found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-primary-50/40 cursor-pointer transition-colors duration-150">
                    <td className="px-5 py-4">
                      <Link href={`/documents/${doc.id}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-900 group-hover:text-primary-700 transition-colors truncate max-w-[200px]">
                          {doc.file_name}
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {doc.patient_id ? (
                        <Link href={`/patients/${doc.patient_id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                          {doc.patient_name || 'Unknown'}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-500">{doc.total_pages ?? '-'}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-500">{doc.report_count}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-400">{formatDateLong(doc.created_at)}</span>
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
