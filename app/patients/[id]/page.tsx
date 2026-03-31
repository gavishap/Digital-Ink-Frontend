'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getPatientDetail,
  getReportDownloadUrl,
  saveCaseInfo,
  type PatientDetail,
  type PatientDocument,
  type PatientReport,
  type CaseInfoData,
} from '@/lib/api/patients';
import { CaseInfoForm } from '@/components/forms/CaseInfoForm';
import { getStatusStyle, formatDate, formatDateLong } from '@/lib/design';

export default function PatientDetailPage() {
  const { session } = useAuth();
  const params = useParams();
  const patientId = params.id as string;

  const router = useRouter();
  const [data, setData] = useState<PatientDetail | null>(null);
  const [error, setError] = useState('');
  const [showCaseInfo, setShowCaseInfo] = useState(false);
  const [savingCase, setSavingCase] = useState(false);
  const fetchRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const detail = await getPatientDetail(patientId);
      setData(detail);
    } catch {
      setError('Failed to load patient');
    }
  }, [patientId]);

  if (!fetchRef.current && session) {
    fetchRef.current = true;
    load();
  }

  if (!data && !error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading patient...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">{error}</div>
        <Link href="/" className="text-primary-600 text-sm mt-4 inline-block hover:text-primary-700 font-medium transition-colors">Back to Patients</Link>
      </div>
    );
  }

  if (!data) return null;

  const { patient, documents, reports } = data;
  const fullName = `${patient.first_name} ${patient.last_name}`;

  const handleCaseInfoSubmit = async (caseData: CaseInfoData) => {
    setSavingCase(true);
    try {
      await saveCaseInfo(patientId, caseData);
      setShowCaseInfo(false);
      router.push(`/scan?patientId=${patientId}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save case info');
    } finally {
      setSavingCase(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 animate-fade-in">
        <Link href="/" className="hover:text-primary-600 transition-colors font-medium">Patients</Link>
        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 font-medium">{fullName}</span>
      </div>

      {/* Patient Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 mb-8 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-md shadow-primary-500/20">
              <span className="text-lg font-bold text-white font-display">{patient.first_name[0]}{patient.last_name[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                {patient.date_of_birth && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    {formatDate(patient.date_of_birth)}
                  </span>
                )}
                {patient.phone_primary && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    {patient.phone_primary}
                  </span>
                )}
                <span className="text-xs text-slate-400 bg-surface-100 px-2 py-0.5 rounded-md">Added {formatDate(patient.created_at)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCaseInfo(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium rounded-xl shadow-soft hover:shadow-glow hover:from-primary-700 hover:to-primary-800 transition-all duration-300 active:scale-[0.97] shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Exam
          </button>
        </div>
      </div>

      {/* Documents */}
      <h2 className="text-lg font-display font-semibold text-slate-900 mb-3 animate-slide-up stagger-2">Documents</h2>
      <DocumentsTable documents={documents} />

      {/* Reports */}
      <h2 className="text-lg font-display font-semibold text-slate-900 mt-10 mb-3 animate-slide-up stagger-4">Reports</h2>
      <ReportsList reports={reports} />

      {/* Case Info Modal */}
      {showCaseInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCaseInfo(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">Case Information</h2>
                <p className="text-sm text-slate-500 mt-1">Enter the case details before starting the exam scan.</p>
              </div>
              <button
                onClick={() => setShowCaseInfo(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-surface-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CaseInfoForm onSubmit={handleCaseInfoSubmit} loading={savingCase} />
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsTable({ documents }: { documents: PatientDocument[] }) {
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-10 text-center animate-slide-up stagger-3">
        <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm font-medium">No documents scanned yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden animate-slide-up stagger-3">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display">Document</th>
            <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display">Status</th>
            <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display hidden md:table-cell">Pages</th>
            <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {documents.map((doc) => {
            const style = getStatusStyle(doc.status);
            return (
              <tr key={doc.id} className="group hover:bg-primary-50/40 cursor-pointer transition-colors duration-150">
                <td className="px-5 py-4">
                  <Link href={`/documents/${doc.id}`} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-primary-700 transition-colors">
                      {doc.file_name}
                    </p>
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <span className="text-sm text-slate-500">{doc.total_pages ?? '-'}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-slate-400">{formatDateLong(doc.created_at)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReportsList({ reports }: { reports: PatientReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-10 text-center animate-slide-up stagger-5">
        <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm font-medium">No reports generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-slide-up stagger-5">
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  );
}

function ReportCard({ report }: { report: PatientReport }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { download_url } = report.download_url
        ? { download_url: report.download_url }
        : await getReportDownloadUrl(report.id);
      window.open(download_url, '_blank');
    } catch {
      alert('Failed to get download link');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const { download_url } = report.download_url
        ? { download_url: report.download_url }
        : await getReportDownloadUrl(report.id);
      const w = window.open(download_url, '_blank');
      if (w) {
        w.addEventListener('load', () => w.print());
      }
    } catch {
      alert('Failed to open for printing');
    }
  };

  const typeName = report.report_type === 'extraction_findings' ? 'Findings Report' : (report.report_type ?? 'Report');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card px-5 py-4 flex items-center justify-between hover:shadow-elevated transition-all duration-200 group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0 group-hover:bg-accent-100 transition-colors">
          <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{typeName}</p>
          <p className="text-xs text-slate-400 mt-0.5">Generated {formatDateLong(report.created_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-primary-600 font-medium border border-primary-200 rounded-xl hover:bg-primary-50 transition-all duration-200 disabled:opacity-50 active:scale-[0.97]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-slate-600 font-medium border border-slate-200 rounded-xl hover:bg-surface-50 hover:border-slate-300 transition-all duration-200 active:scale-[0.97]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.159 48.159 0 018.5 0m-8.5 0V6.375a2.25 2.25 0 012.25-2.25h3.5a2.25 2.25 0 012.25 2.25V6.7" />
          </svg>
          Print
        </button>
      </div>
    </div>
  );
}
