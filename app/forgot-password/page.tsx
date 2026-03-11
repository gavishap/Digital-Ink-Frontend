'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[20%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-primary-100/40 to-accent-100/20 blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[15%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-primary-50/60 to-accent-50/30 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-sm text-slate-500 mt-1.5">We&apos;ll send you a reset link</p>
        </div>

        <div className="bg-white rounded-2xl shadow-elevated border border-slate-200/50 p-8">
          {sent ? (
            <div className="text-center animate-scale-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-display font-semibold text-slate-900">Check your email</p>
              <p className="text-sm text-slate-500 mt-1.5">
                We sent a reset link to <strong className="text-slate-700">{email}</strong>
              </p>
              <a href="/login" className="inline-block mt-5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                Back to login
              </a>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <a href="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Back to login
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
