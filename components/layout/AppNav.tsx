'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { href: '/', label: 'Patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/documents', label: 'Documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const ADMIN_ITEMS = [
  { href: '/admin/team', label: 'Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

export function AppNav() {
  const { user, signOut, role, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading || !user) return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] glass-card border-b border-white/30">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-[34px] h-[34px] rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/25 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary-500/30 group-hover:scale-105 group-active:scale-95">
            <svg className="w-[16px] h-[16px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <span className="font-display font-bold text-[15px] text-slate-900 tracking-tight">Digital Ink</span>
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center h-full gap-6">
          {[...NAV_ITEMS, ...(role === 'admin' ? ADMIN_ITEMS : [])].map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-2 px-1 h-full text-[13.5px] font-medium
                  transition-colors duration-200 select-none
                  ${active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'}
                `}
              >
                <svg className="w-[15px] h-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2 : 1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-primary-500" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User area */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2.5 bg-white/60 border border-slate-200/60 rounded-xl px-3 py-1.5 backdrop-blur-sm">
            <div className="w-[24px] h-[24px] rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shrink-0 ring-2 ring-white">
              <span className="text-[10px] font-bold text-white leading-none">{(user.email?.[0] ?? '?').toUpperCase()}</span>
            </div>
            <span className="text-[13px] text-slate-600 max-w-[160px] truncate">{user.email}</span>
          </div>
          <button
            onClick={signOut}
            className="text-[13px] font-medium text-slate-400 hover:text-slate-700 transition-all duration-200 px-3 py-1.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white/60 active:scale-[0.97]"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden border-t border-slate-100/50 px-4 flex gap-1 overflow-x-auto h-10 items-center bg-white/50 backdrop-blur-sm">
        {[...NAV_ITEMS, ...(role === 'admin' ? ADMIN_ITEMS : [])].map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap
                transition-all duration-200
                ${active ? 'text-primary-700 bg-primary-50' : 'text-slate-500 hover:text-slate-800 hover:bg-surface-100'}
              `}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
