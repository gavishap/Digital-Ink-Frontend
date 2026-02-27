'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardStats } from './dashboard-actions';

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;

const ACTION_LABELS: Record<string, string> = {
  extraction_started: 'Extraction started',
  extraction_completed: 'Extraction completed',
  document_uploaded: 'Document uploaded',
  report_generated: 'Report generated',
  reanalysis_started: 'Re-analysis started',
};

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const fetchStarted = useRef(false);

  if (!fetchStarted.current) {
    fetchStarted.current = true;
    getDashboardStats().then(setStats).catch(() => {
      setStats({
        totalDocuments: 0,
        completedJobs: 0,
        totalReports: 0,
        processingJobs: 0,
        recentActivity: [],
      });
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">
          {role === 'admin' ? 'Administrator' : 'Staff'} Dashboard
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Documents', value: stats?.totalDocuments ?? '-', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'blue' },
          { label: 'Completed', value: stats?.completedJobs ?? '-', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'green' },
          { label: 'Reports', value: stats?.totalReports ?? '-', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', color: 'indigo' },
          { label: 'Processing', value: stats?.processingJobs ?? '-', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', color: 'amber' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                stat.color === 'green' ? 'bg-emerald-50 text-emerald-600' :
                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <Link href="/scan" className="group bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white hover:shadow-lg hover:shadow-blue-200/50 transition-all hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-1">New Scan</h3>
          <p className="text-blue-100 text-sm">Annotate and analyze new patient documents</p>
        </Link>

        <Link href="/documents" className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
            <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Documents</h3>
          <p className="text-gray-500 text-sm">Browse all scanned documents and reports</p>
        </Link>

        {role === 'admin' && (
          <Link href="/admin/team" className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
              <svg className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Team</h3>
            <p className="text-gray-500 text-sm">Manage team members and permissions</p>
          </Link>
        )}
      </div>

      {/* Recent Activity */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!stats ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading activity...</div>
        ) : stats.recentActivity.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No recent activity</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentActivity.map((a) => (
              <div key={a.id} className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    a.action.includes('completed') ? 'bg-emerald-500' :
                    a.action.includes('started') ? 'bg-blue-500' :
                    a.action.includes('generated') ? 'bg-indigo-500' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {ACTION_LABELS[a.action] ?? a.action.replace(/_/g, ' ')}
                    </p>
                    {a.details && (
                      <p className="text-xs text-gray-400">
                        {(a.details as Record<string, unknown>).pages && `${(a.details as Record<string, unknown>).pages} pages`}
                        {(a.details as Record<string, unknown>).model && ` · ${(a.details as Record<string, unknown>).model}`}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
