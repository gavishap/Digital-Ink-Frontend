'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInitials } from '@/lib/design';
import {
  getTeamMembers,
  inviteTeamMember,
  updateMemberRole,
  deactivateMember,
} from './actions';

type Member = {
  id: string;
  email: string;
  name: string;
  role: string;
  last_login: string | null;
  created_at: string;
};

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const fetchStarted = useRef(false);

  const loadMembers = useCallback(async () => {
    const { members: data, error: err } = await getTeamMembers();
    if (err) setError(err);
    else setMembers(data);
    setLoaded(true);
  }, []);

  if (!loaded && !fetchStarted.current) {
    fetchStarted.current = true;
    loadMembers();
  }

  async function handleInvite(formData: FormData) {
    setInviteError('');
    setInviting(true);
    const result = await inviteTeamMember(formData);
    setInviting(false);
    if (result.error) {
      setInviteError(result.error);
    } else {
      setInviteOpen(false);
      loadMembers();
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    const result = await updateMemberRole(userId, newRole);
    if (result.error) setError(result.error);
    else loadMembers();
  }

  async function handleDeactivate(userId: string) {
    const result = await deactivateMember(userId);
    setConfirmDeactivate(null);
    if (result.error) setError(result.error);
    else loadMembers();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-slate-500 mt-1.5 text-[15px]">
            <span className="font-semibold text-slate-700">{members.length}</span> member{members.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        <button
          onClick={() => { setInviteOpen(true); setInviteError(''); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium rounded-xl shadow-soft hover:shadow-glow hover:from-primary-700 hover:to-primary-800 transition-all duration-300 active:scale-[0.97]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Invite Member
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-5 text-sm text-rose-700 flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Invite Form */}
      {inviteOpen && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 mb-6 animate-scale-in">
          <h2 className="text-lg font-display font-semibold text-slate-900 mb-5">Invite New Member</h2>
          <form action={handleInvite} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 font-display">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-surface-50/50 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 font-display">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-surface-50/50 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 font-display">Role</label>
                <select
                  name="role"
                  defaultValue="staff"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-surface-50/50 transition-all duration-200 hover:border-slate-300"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {inviteError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <p className="text-sm text-rose-700">{inviteError}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={inviting}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium rounded-xl shadow-soft hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all duration-300 active:scale-[0.97]"
              >
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-surface-50 hover:border-slate-300 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-slate-400">
              They&apos;ll be created with a temporary password and should use &quot;Forgot Password&quot; to set their own.
            </p>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3 animate-slide-up stagger-2">
        {!loaded ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Loading team members...</p>
            </div>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium">No team members yet</p>
            <p className="text-slate-400 text-xs mt-1">Invite someone to get started</p>
          </div>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card px-5 py-4 flex items-center justify-between hover:shadow-elevated transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white">
                  <span className="text-sm font-bold text-white">{getInitials(m.name)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                    {m.id === user?.id && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 text-primary-600 border border-primary-100">You</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  disabled={m.id === user?.id}
                  className={`text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all duration-200 font-medium ${
                    m.role === 'admin'
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : 'bg-surface-50 border-slate-200 text-slate-700'
                  } disabled:opacity-50`}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>

                {m.id !== user?.id && (
                  confirmDeactivate === m.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeactivate(m.id)}
                        className="text-xs text-rose-600 font-semibold hover:text-rose-800 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-all duration-200"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeactivate(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 px-2.5 py-1.5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeactivate(m.id)}
                      className="text-xs text-slate-400 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-all duration-200"
                    >
                      Remove
                    </button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
