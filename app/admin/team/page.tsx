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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">Invite and manage team members</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md transition-colors"
          >
            Back
          </a>
          <button
            onClick={() => { setInviteOpen(true); setInviteError(''); }}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Invite Member
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {inviteOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite New Member</h2>
          <form action={handleInvite} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  defaultValue="staff"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {inviteError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2">
                <p className="text-sm text-red-700">{inviteError}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500">
              The user will be created with a temporary password and should use &quot;Forgot Password&quot; to set their own.
            </p>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Name</th>
              <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Email</th>
              <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Role</th>
              <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Last Login</th>
              <th className="text-right text-sm font-medium text-gray-600 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loaded ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">Loading...</td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">No team members yet</td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-sm text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      disabled={m.id === user?.id}
                      className="text-sm border border-gray-200 rounded px-2 py-1 text-gray-900 disabled:opacity-50"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {m.last_login
                      ? new Date(m.last_login).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.id === user?.id ? (
                      <span className="text-xs text-gray-400">You</span>
                    ) : confirmDeactivate === m.id ? (
                      <span className="flex items-center justify-end gap-2">
                        <span className="text-xs text-red-600">Confirm?</span>
                        <button
                          onClick={() => handleDeactivate(m.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeactivate(null)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDeactivate(m.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
