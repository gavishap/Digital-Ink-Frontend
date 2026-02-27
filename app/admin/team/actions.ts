'use server';

import { createAdminClient, createClient } from '../../../lib/supabase/server';
import { revalidatePath } from 'next/cache';

function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let pw = '';
  for (let i = 0; i < 16; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export async function getTeamMembers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, email, name, role, last_login, created_at')
    .order('created_at', { ascending: true });

  if (error) return { error: error.message, members: [] };
  return { members: data ?? [], error: null };
}

export async function inviteTeamMember(formData: FormData) {
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  const role = (formData.get('role') as string) || 'staff';

  if (!email || !name) {
    return { error: 'Email and name are required' };
  }

  const admin = await createAdminClient();

  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password: generateTempPassword(),
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes('already been registered')) {
      return { error: 'A user with this email already exists' };
    }
    return { error: createError.message };
  }

  const { error: profileError } = await admin
    .from('admin_profiles')
    .insert({ id: authUser.user.id, email, name, role });

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: profileError.message };
  }

  revalidatePath('/admin/team');
  return { error: null };
}

export async function updateMemberRole(userId: string, newRole: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('admin_profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) return { error: error.message };
  revalidatePath('/admin/team');
  return { error: null };
}

export async function deactivateMember(userId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) {
    return { error: 'You cannot deactivate yourself' };
  }

  const { error } = await supabase
    .from('admin_profiles')
    .delete()
    .eq('id', userId);

  if (error) return { error: error.message };
  revalidatePath('/admin/team');
  return { error: null };
}
