'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setLoading(false);
      if (authError.message.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account before logging in.');
      } else if (authError.message.includes('Invalid login credentials')) {
        setError('Invalid email or password.');
      } else {
        setError(authError.message);
      }
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[20%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-primary-100/40 to-accent-100/20 blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[15%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-primary-50/60 to-accent-50/30 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Digital Ink</h1>
          <p className="text-sm text-slate-500 mt-1.5">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-elevated border border-slate-200/50 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5 font-display">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-surface-50/50 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5 font-display">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-surface-50/50 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft hover:shadow-glow active:scale-[0.98]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
