import { supabase } from '@/shared/db/supabase';
import { useAuthStore } from './auth.store';

let started = false;

export async function initAuth(): Promise<void> {
  if (started) return;
  started = true;

  const { data } = await supabase.auth.getSession();
  const initial = data.session;
  if (initial) {
    useAuthStore
      .getState()
      .signIn(initial.user.id, initial.user.email ?? '');
  }
  useAuthStore.getState().markReady();

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      useAuthStore.getState().signIn(session.user.id, session.user.email ?? '');
    } else {
      useAuthStore.getState().signOut();
    }
  });
}
