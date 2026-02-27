'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
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

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setInviteOpen(true); setInviteError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Invite Member
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Invite Form */}
      {inviteOpen && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite New Member</h2>
          <form action={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50/50 placeholder:text-gray-400"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50/50 placeholder:text-gray-400"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  name="role"
                  defaultValue="staff"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50/50"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {inviteError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-700">{inviteError}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-400">
              They&apos;ll be created with a temporary password and should use &quot;Forgot Password&quot; to set their own.
            </p>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {!loaded ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            Loading team members...
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            No team members yet. Invite someone to get started.
          </div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{getInitials(m.name)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                    {m.id === user?.id && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">You</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  disabled={m.id === user?.id}
                  className={`text-sm border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    m.role === 'admin'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
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
                        className="text-xs text-red-600 font-medium hover:text-red-800 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeactivate(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeactivate(m.id)}
                      className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
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
