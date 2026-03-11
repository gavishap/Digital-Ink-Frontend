'use client';

import Link from 'next/link';
import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { listPatients, createPatient, type PatientListItem } from '@/lib/api/patients';
import { formatDate, formatPhone, getGreeting } from '@/lib/design';

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const fetchRef = useRef(false);

  const load = useCallback(async (s?: string) => {
    try {
      const res = await listPatients({ search: s ?? search, limit: 50 });
      setPatients(res.patients);
      setTotal(res.total);
    } catch {
      setError('Failed to load patients');
    } finally {
      setLoaded(true);
    }
  }, [search]);

  if (!fetchRef.current && user) {
    fetchRef.current = true;
    load();
  }

  const userName = user?.email?.split('@')[0] ?? '';

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
      {/* Welcome Header */}
      <div className="animate-slide-up mb-8">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
              {getGreeting()}{userName ? `, ${userName}` : ''}
            </h1>
            <p className="text-slate-500 mt-1.5 text-[15px]">
              You have <span className="font-semibold text-slate-700">{total}</span> patients in your workspace
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium rounded-xl shadow-soft hover:shadow-glow hover:from-primary-700 hover:to-primary-800 transition-all duration-300 active:scale-[0.97]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Patient
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 animate-slide-up stagger-2">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search by patient name or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
          className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
        />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-5 text-sm text-rose-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden animate-slide-up stagger-3">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display">Name</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display hidden md:table-cell">Date of Birth</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display hidden md:table-cell">Phone</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display">Documents</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 font-display hidden sm:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loaded ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-400 text-sm">Loading patients...</p>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center">
                        <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500 text-sm font-medium">No patients found</p>
                        <button onClick={() => setShowModal(true)} className="text-primary-600 text-sm hover:text-primary-700 mt-1 font-medium transition-colors">
                          Add your first patient
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((p, i) => (
                  <tr
                    key={p.id}
                    className="group hover:bg-primary-50/40 cursor-pointer transition-colors duration-150"
                    style={{ animationDelay: `${(i + 3) * 30}ms` }}
                  >
                    <td className="px-5 py-4">
                      <Link href={`/patients/${p.id}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shrink-0 group-hover:from-primary-200 group-hover:to-primary-300 transition-colors">
                          <span className="text-[11px] font-bold text-primary-700">
                            {p.first_name?.[0]}{p.last_name?.[0]}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 group-hover:text-primary-700 transition-colors">
                          {p.first_name} {p.last_name}
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-500">{p.date_of_birth ? formatDate(p.date_of_birth) : '-'}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-500">{formatPhone(p.phone_primary)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        {p.document_count}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-slate-400">{formatDate(p.created_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CreatePatientModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreatePatientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createPatient({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dob || undefined,
        phone_primary: phone.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create patient');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 overflow-hidden animate-scale-in border border-slate-200/50">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-display font-bold text-slate-900">Add New Patient</h2>
          <p className="text-sm text-slate-500 mt-1">Enter the patient&apos;s basic information</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-sm text-rose-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 font-display">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-white placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
                placeholder="John"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 font-display">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-white placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 font-display">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-white transition-all duration-200 hover:border-slate-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 font-display">Cell Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-900 bg-white placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-surface-50 hover:border-slate-300 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-soft hover:from-primary-700 hover:to-primary-800 hover:shadow-glow disabled:opacity-50 transition-all duration-300 active:scale-[0.97]"
            >
              {saving ? 'Creating...' : 'Create Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
