import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, type Credentials } from '../services/auth.service';
import { useAuthStore } from '../state/auth.store';

export function useCurrentAccount() {
  const accountId = useAuthStore((s) => s.accountId);
  const email = useAuthStore((s) => s.email);
  return {
    accountId,
    email,
    isAuthenticated: email !== null,
  };
}

export function useAuthReady(): boolean {
  return useAuthStore((s) => s.ready);
}

export function useSignup() {
  return useMutation({
    mutationFn: (input: Credentials) => authService.signup(input),
    // store é atualizado pelo listener onAuthStateChange
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (input: Credentials) => authService.login(input),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return async () => {
    await authService.logout();
    qc.clear();
  };
}
