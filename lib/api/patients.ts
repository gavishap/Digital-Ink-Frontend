import { createClient } from '../supabase/client';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

async function authHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

// =============================================================================
// Types
// =============================================================================

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone_primary: string | null;
  created_at: string;
}

export interface PatientListItem extends Patient {
  document_count: number;
}

export interface PatientDocument {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  total_pages: number | null;
  created_at: string;
  latest_job: {
    id: string;
    status: string;
    completed_at: string | null;
    percentage: number | null;
  } | null;
}

export interface PatientReport {
  id: string;
  report_type: string | null;
  status: string | null;
  storage_path: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  download_url: string | null;
  source_document_ids: string[] | null;
}

export interface PatientDetail {
  patient: Patient;
  documents: PatientDocument[];
  reports: PatientReport[];
}

// =============================================================================
// API Functions
// =============================================================================

export async function createPatient(data: {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone_primary?: string;
}): Promise<{ patient_id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to create patient');
  }
  return response.json();
}

export async function listPatients(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ patients: PatientListItem[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));

  const response = await fetch(`${API_BASE_URL}/api/patients?${qs}`, {
    headers: await authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch patients');
  return response.json();
}

export async function getPatientDetail(id: string): Promise<PatientDetail> {
  const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
    headers: await authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch patient detail');
  return response.json();
}

export async function getReportDownloadUrl(reportId: string): Promise<{ report_id: string; download_url: string }> {
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/download`, {
    headers: await authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get report download URL');
  return response.json();
}


// =============================================================================
// Case Info (Workers' Comp case demographics)
// =============================================================================

export interface CaseInfoData {
  claim_number?: string;
  wcab_venue?: string;
  case_number?: string;
  injury_date?: string;
  exam_date?: string;
  interpreter_language?: string;
  patient_sex?: string;
  employer_name?: string;
  occupation?: string;
  patient_address?: string;
  patient_city?: string;
  patient_state?: string;
  patient_zip?: string;
  employer_address?: string;
  employer_city?: string;
  employer_state?: string;
  employer_zip?: string;
  claims_admin_name?: string;
  claims_admin_address?: string;
  claims_admin_city?: string;
  claims_admin_state?: string;
  claims_admin_zip?: string;
  claims_admin_phone?: string;
}

export async function saveCaseInfo(
  patientId: string,
  data: CaseInfoData,
): Promise<{ status: string; patient_id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/case-info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Failed to save case info');
  }
  return response.json();
}
