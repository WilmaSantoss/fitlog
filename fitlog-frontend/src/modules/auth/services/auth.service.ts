import { supabase } from '@/shared/db/supabase';
import type { AuthIdentity } from '../domain/auth-identity.types';

export type Credentials = {
  readonly email: string;
  readonly password: string;
};

export class AuthError extends Error {
  readonly code: 'email_in_use' | 'invalid_credentials' | 'unexpected';
  constructor(
    code: 'email_in_use' | 'invalid_credentials' | 'unexpected',
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

export interface IAuthService {
  signup(input: Credentials): Promise<AuthIdentity>;
  login(input: Credentials): Promise<AuthIdentity>;
  logout(): Promise<void>;
}

class SupabaseAuthService implements IAuthService {
  async signup(input: Credentials): Promise<AuthIdentity> {
    const email = input.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already') || msg.includes('registered')) {
        throw new AuthError('email_in_use', 'Este email já está cadastrado.');
      }
      throw new AuthError('unexpected', error.message);
    }
    if (!data.user) {
      throw new AuthError('unexpected', 'Não foi possível criar a conta.');
    }
    return { id: data.user.id, email: data.user.email ?? email };
  }

  async login(input: Credentials): Promise<AuthIdentity> {
    const email = input.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (error) {
      throw new AuthError('invalid_credentials', 'Email ou senha incorretos.');
    }
    if (!data.user) {
      throw new AuthError('invalid_credentials', 'Email ou senha incorretos.');
    }
    return { id: data.user.id, email: data.user.email ?? email };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }
}

export const authService: IAuthService = new SupabaseAuthService();
