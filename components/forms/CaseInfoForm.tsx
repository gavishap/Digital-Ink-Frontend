'use client';

import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { CaseInfoData } from '../../lib/api/patients';

const usStates = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

interface CaseInfoFormProps {
  initialData?: CaseInfoData;
  onSubmit: (data: CaseInfoData) => void | Promise<void>;
  loading?: boolean;
}

export function CaseInfoForm({ initialData, onSubmit, loading }: CaseInfoFormProps) {
  const [form, setForm] = useState<CaseInfoData>(initialData ?? {});

  const set = (field: keyof CaseInfoData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: CaseInfoData = {};
    for (const [k, v] of Object.entries(form)) {
      if (v && typeof v === 'string' && v.trim()) {
        (cleaned as Record<string, string>)[k] = v.trim();
      }
    }
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 font-display">Case Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Claim Number" value={form.claim_number ?? ''} onChange={set('claim_number')} placeholder="e.g. 2080391856" />
          <Input label="WCAB Venue" value={form.wcab_venue ?? ''} onChange={set('wcab_venue')} placeholder="e.g. POM" />
          <Input label="Case #" value={form.case_number ?? ''} onChange={set('case_number')} placeholder="e.g. ADJ17023256" />
          <Input label="Date of Injury" value={form.injury_date ?? ''} onChange={set('injury_date')} placeholder="e.g. CT 1/1/10 to 2/28/23" />
          <Input label="Date of Current Exam" type="date" value={form.exam_date ?? ''} onChange={set('exam_date')} />
          <Input label="Interpreter Language" value={form.interpreter_language ?? ''} onChange={set('interpreter_language')} placeholder="Leave blank if none" />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 font-display">Patient Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Sex" value={form.patient_sex ?? ''} onChange={set('patient_sex')} options={[{ value: '', label: 'Select...' }, { value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]} />
          <Input label="Occupation" value={form.occupation ?? ''} onChange={set('occupation')} />
          <Input label="Address" value={form.patient_address ?? ''} onChange={set('patient_address')} className="md:col-span-2" />
          <Input label="City" value={form.patient_city ?? ''} onChange={set('patient_city')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="State" value={form.patient_state ?? ''} onChange={set('patient_state')} options={[{ value: '', label: 'Select...' }, ...usStates]} />
            <Input label="Zip" value={form.patient_zip ?? ''} onChange={set('patient_zip')} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 font-display">Employer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Employer Name" value={form.employer_name ?? ''} onChange={set('employer_name')} />
          <Input label="Employer Address" value={form.employer_address ?? ''} onChange={set('employer_address')} className="md:col-span-2" />
          <Input label="City" value={form.employer_city ?? ''} onChange={set('employer_city')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="State" value={form.employer_state ?? ''} onChange={set('employer_state')} options={[{ value: '', label: 'Select...' }, ...usStates]} />
            <Input label="Zip" value={form.employer_zip ?? ''} onChange={set('employer_zip')} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 font-display">Claims Administrator / Insurer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value={form.claims_admin_name ?? ''} onChange={set('claims_admin_name')} />
          <Input label="Phone" value={form.claims_admin_phone ?? ''} onChange={set('claims_admin_phone')} type="tel" />
          <Input label="Address" value={form.claims_admin_address ?? ''} onChange={set('claims_admin_address')} className="md:col-span-2" />
          <Input label="City" value={form.claims_admin_city ?? ''} onChange={set('claims_admin_city')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="State" value={form.claims_admin_state ?? ''} onChange={set('claims_admin_state')} options={[{ value: '', label: 'Select...' }, ...usStates]} />
            <Input label="Zip" value={form.claims_admin_zip ?? ''} onChange={set('claims_admin_zip')} />
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save & Start Exam'}
        </button>
      </div>
    </form>
  );
}
