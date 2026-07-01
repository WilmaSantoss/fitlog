import { useEffect, type ReactNode } from 'react';
import { AppProviders } from './providers';
import { AppRouter } from './router';
import { initAuth } from '@/modules/auth/state/auth.init';
import { useAuthReady } from '@/modules/auth/hooks/use-auth';

export function AppRoot() {
  useEffect(() => {
    void initAuth();
  }, []);
  return (
    <AppProviders>
      <AuthGate>
        <AppRouter />
      </AuthGate>
    </AppProviders>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const ready = useAuthReady();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-deep text-sm text-fg-muted">
        Carregando…
      </div>
    );
  }
  return <>{children}</>;
}
