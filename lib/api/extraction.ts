/**
 * API client for the Form Extractor backend.
 * Handles document analysis and result retrieval.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// =============================================================================
// Types
// =============================================================================

export interface AnalyzeResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  total_pages?: number;
  percentage?: number;
  current_stage?: string;
  message?: string;
  result_path?: string;
}

export interface ExtractionSummary {
  job_id: string;
  patient_name?: string;
  patient_dob?: string;
  form_date?: string;
  overall_confidence: number;
  total_pages: number;
  total_items_needing_review: number;
  extraction_timestamp: string;
}

export interface FieldValue {
  value?: string;
  is_checked?: boolean;
  circled_options?: string[];
  confidence: number;
  has_correction?: boolean;
  original_value?: string;
}

export interface AnnotationGroup {
  group_id: string;
  interpretation: string;
  clinical_significance?: string;
  member_element_ids: string[];
  note?: string;
}

export interface FreeFormAnnotation {
  annotation_id: string;
  text_content: string;
  location_description: string;
  interpretation?: string;
  confidence: number;
  needs_review: boolean;
  review_reason?: string;
}

export interface PageResult {
  page_number: number;
  field_values: Record<string, FieldValue>;
  annotation_groups: AnnotationGroup[];
  free_form_annotations: FreeFormAnnotation[];
  spatial_connections: any[];
  cross_page_references: any[];
  overall_confidence: number;
  items_needing_review: number;
  review_reasons: string[];
}

export interface ExtractionResult {
  form_id: string;
  form_name: string;
  extraction_timestamp: string;
  patient_name?: string;
  patient_dob?: string;
  form_date?: string;
  overall_confidence: number;
  total_items_needing_review: number;
  all_review_reasons: string[];
  pages: PageResult[];
}

export interface Schema {
  name: string;
  id: string;
  path: string;
  total_pages: number;
}

export interface HealthStatus {
  status: string;
  api_key_configured: boolean;
  extractions_dir: string;
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Check API health status
 */
export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error('API health check failed');
  }
  return response.json();
}

/**
 * Upload and analyze a document
 */
export async function analyzeDocument(
  file: File,
  options?: {
    name?: string;
    schemaPath?: string;
    startPage?: number;
    endPage?: number;
  }
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options?.name) {
    formData.append('name', options.name);
  }
  if (options?.schemaPath) {
    formData.append('schema_path', options.schemaPath);
  }
  if (options?.startPage) {
    formData.append('start_page', options.startPage.toString());
  }
  if (options?.endPage) {
    formData.append('end_page', options.endPage.toString());
  }
  
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }
  
  return response.json();
}

interface PageMetadata {
  originalPageNumber: number;
  documentId: string;
  documentName: string;
}

/**
 * Upload and analyze multiple page images as a batch
 * This is used when capturing annotated pages from the PDF annotator
 */
export async function analyzeDocumentImages(
  pageBlobs: Blob[],
  options?: {
    name?: string;
    schemaPath?: string;
    pageMetadata?: PageMetadata[];
  }
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  
  // Append each page blob as a separate file with document info in filename
  pageBlobs.forEach((blob, index) => {
    const metadata = options?.pageMetadata?.[index];
    const filename = metadata 
      ? `${metadata.documentName.replace(/\s+/g, '_')}_page_${metadata.originalPageNumber}.png`
      : `page_${index + 1}.png`;
    const file = new File([blob], filename, { type: 'image/png' });
    formData.append('files', file);
  });
  
  if (options?.name) {
    formData.append('name', options.name);
  }
  if (options?.schemaPath) {
    formData.append('schema_path', options.schemaPath);
  }
  // Send page metadata as JSON
  if (options?.pageMetadata) {
    formData.append('page_metadata', JSON.stringify(options.pageMetadata));
  }
  
  const response = await fetch(`${API_BASE_URL}/api/analyze-images`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }
  
  return response.json();
}

/**
 * Save annotated PDF documents to the backend
 * These are the complete documents with all pages and annotations
 */
export async function saveAnnotatedPdfs(
  pdfs: { documentName: string; blob: Blob }[],
  jobId?: string,
): Promise<{ success: boolean; savedFiles: string[] }> {
  const formData = new FormData();
  
  pdfs.forEach((pdf, index) => {
    const filename = `${pdf.documentName.replace(/\s+/g, '_')}_annotated.pdf`;
    const file = new File([pdf.blob], filename, { type: 'application/pdf' });
    formData.append('files', file);
  });
  
  if (jobId) {
    formData.append('job_id', jobId);
  }
  
  const response = await fetch(`${API_BASE_URL}/api/save-annotated-pdfs`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to save annotated PDFs');
  }
  
  return response.json();
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get job status');
  }
  
  return response.json();
}

/**
 * Poll for job completion
 */
export async function pollJobStatus(
  jobId: string,
  onProgress?: (status: JobStatus) => void,
  intervalMs: number = 2000,
  maxAttempts: number = 300 // 10 minutes max
): Promise<JobStatus> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const status = await getJobStatus(jobId);
    
    if (onProgress) {
      onProgress(status);
    }
    
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }
  
  throw new Error('Job timed out');
}

/**
 * Get extraction results
 */
export async function getResults(jobId: string): Promise<ExtractionResult> {
  const response = await fetch(`${API_BASE_URL}/api/results/${jobId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get results');
  }
  
  return response.json();
}

/**
 * Get extraction summary
 */
export async function getResultsSummary(jobId: string): Promise<ExtractionSummary> {
  const response = await fetch(`${API_BASE_URL}/api/results/${jobId}/summary`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get summary');
  }
  
  return response.json();
}

/**
 * Get page results
 */
export async function getPageResults(jobId: string, pageNumber: number): Promise<PageResult> {
  const response = await fetch(`${API_BASE_URL}/api/results/${jobId}/page/${pageNumber}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get page results');
  }
  
  return response.json();
}

/**
 * List available schemas
 */
export async function listSchemas(): Promise<Schema[]> {
  const response = await fetch(`${API_BASE_URL}/api/schemas`);
  
  if (!response.ok) {
    throw new Error('Failed to list schemas');
  }
  
  const data = await response.json();
  return data.schemas;
}

/**
 * List completed extractions
 */
export async function listExtractions(): Promise<{ job_id: string; name: string; file_name: string; status: string }[]> {
  const response = await fetch(`${API_BASE_URL}/api/extractions`);
  
  if (!response.ok) {
    throw new Error('Failed to list extractions');
  }
  
  const data = await response.json();
  return data.extractions;
}
