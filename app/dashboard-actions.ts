'use server';

import { createClient } from '../lib/supabase/server';

export async function getDashboardStats() {
  const supabase = await createClient();

  const [docsRes, jobsRes, reportsRes, reviewRes, recentRes] = await Promise.all([
    supabase.from('documents').select('id', { count: 'exact', head: true }),
    supabase.from('extraction_jobs').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('reports').select('id', { count: 'exact', head: true }),
    supabase.from('extraction_jobs').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
    supabase
      .from('audit_log')
      .select('id, action, resource_type, details, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  return {
    totalDocuments: docsRes.count ?? 0,
    completedJobs: jobsRes.count ?? 0,
    totalReports: reportsRes.count ?? 0,
    processingJobs: reviewRes.count ?? 0,
    recentActivity: (recentRes.data ?? []).map((a) => ({
      id: a.id,
      action: a.action,
      resourceType: a.resource_type,
      details: a.details,
      createdAt: a.created_at,
    })),
  };
}
