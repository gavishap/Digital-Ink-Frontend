import { createClient } from '../supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function authHeaders(token?: string): Promise<HeadersInit> {
  if (token) return { Authorization: `Bearer ${token}` };
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export interface DocumentListItem {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  total_pages: number | null;
  created_at: string;
  updated_at: string;
  patient_name: string;
  patient_id: string | null;
  latest_job: {
    id: string;
    status: string;
    completed_at: string | null;
    percentage: number | null;
  } | null;
  report_count: number;
}

export interface PdfFile {
  path: string;
  name: string;
  url: string | null;
}

export interface RelatedDocument {
  id: string;
  file_name: string;
  status: string;
  total_pages: number | null;
  created_at: string;
}

export interface DocumentPage {
  page_number: number;
  image_url: string | null;
  schema_page_id: string | null;
}

export interface DocumentDetail {
  document: {
    id: string;
    file_name: string;
    file_type: string;
    status: string;
    total_pages: number | null;
    storage_path: string | null;
    created_at: string;
    updated_at: string;
    patient: Record<string, string> | null;
    patient_id: string | null;
  };
  pdfs: PdfFile[];
  pages: Array<{ page_number: number; image_url: string | null }>;
  jobs: Array<{
    id: string;
    status: string;
    progress: number | null;
    total_pages: number | null;
    percentage: number | null;
    current_stage: string | null;
    ai_model_used: string | null;
    processing_time_ms: number | null;
    created_at: string;
    completed_at: string | null;
  }>;
  latest_results: Array<Record<string, unknown>>;
  reports: Array<{
    id: string;
    report_type: string | null;
    status: string | null;
    storage_path: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
  }>;
  audit_log: Array<{
    id: string;
    action: string;
    resource_type: string | null;
    user_id: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
  }>;
  related_documents: RelatedDocument[];
}

export async function listDocuments(params?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
  token?: string;
}): Promise<{ documents: DocumentListItem[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.status) qs.set('status', params.status);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));

  const response = await fetch(`${API_BASE_URL}/api/documents?${qs}`, {
    headers: await authHeaders(params?.token),
  });
  if (!response.ok) throw new Error('Failed to fetch documents');
  return response.json();
}

export async function getDocumentDetail(documentId: string, token?: string): Promise<DocumentDetail> {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
    headers: await authHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch document detail');
  return response.json();
}

export async function getDocumentPages(documentId: string, token?: string): Promise<{ document_id: string; pages: DocumentPage[] }> {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/pages`, {
    headers: await authHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch document pages');
  return response.json();
}

export async function reanalyzeDocument(documentId: string, token?: string): Promise<{ job_id: string; status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/reanalyze`, {
    method: 'POST',
    headers: await authHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to start re-analysis');
  return response.json();
}
