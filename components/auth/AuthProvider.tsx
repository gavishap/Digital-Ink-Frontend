'use client';

import { useAuth } from '../../hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, signOut, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">Digital Ink</span>
          {role === 'admin' && (
            <a
              href="/admin/team"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Team
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button
            onClick={signOut}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
      {children}
    </>
  );
}
