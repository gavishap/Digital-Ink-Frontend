'use client';

import { useAuth } from '../../hooks/useAuth';
import { AppNav } from '../layout/AppNav';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-display font-semibold text-slate-700">Digital Ink</p>
            <p className="text-xs text-slate-400">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-surface-50" style={{ paddingTop: 60 }}>{children}</main>
    </>
  );
}
