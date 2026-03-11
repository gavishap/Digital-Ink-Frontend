'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/login'), 2000);
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Set New Password</h1>
          <p className="text-sm text-slate-500 mt-1.5">Choose a strong password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-elevated border border-slate-200/50 p-8">
          {success ? (
            <div className="text-center animate-scale-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-display font-semibold text-slate-900">Password updated</p>
              <p className="text-sm text-slate-500 mt-1.5">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5 font-display">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-surface-50/50 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1.5 font-display">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-surface-50/50 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
                  placeholder="Re-enter password"
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
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
