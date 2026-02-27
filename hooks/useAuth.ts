'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase/client';

type AuthState = {
  user: User | null;
  session: Session | null;
  role: string | null;
  isAdmin: boolean;
  isLoading: boolean;
};

let state: AuthState = {
  user: null,
  session: null,
  role: null,
  isAdmin: false,
  isLoading: true,
};
let listeners: Array<() => void> = [];
let initialized = false;

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot(): AuthState {
  return { user: null, session: null, role: null, isAdmin: false, isLoading: true };
}

async function fetchRole(userId: string): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role ?? null;
  } catch {
    return null;
  }
}

async function resolveAuth(session: Session | null) {
  let role: string | null = null;
  if (session?.user) {
    role = await fetchRole(session.user.id);
  }
  state = {
    user: session?.user ?? null,
    session,
    role,
    isAdmin: role === 'admin',
    isLoading: false,
  };
  emitChange();
}

function initAuth() {
  if (initialized) return;
  initialized = true;

  const supabase = createClient();

  supabase.auth.getSession()
    .then(({ data: { session } }) => resolveAuth(session))
    .catch(() => resolveAuth(null));

  supabase.auth.onAuthStateChange((_event, session) => {
    resolveAuth(session);
  });
}

export function useAuth() {
  initAuth();
  const authState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const router = useRouter();

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }, [router]);

  return { ...authState, signOut };
}
