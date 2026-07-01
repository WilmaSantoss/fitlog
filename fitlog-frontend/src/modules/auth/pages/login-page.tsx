import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { PasswordInput } from '@/shared/ui/password-input';
import { AuthShell } from '../components/auth-shell';
import {
  loginSchema,
  type LoginFormParsed,
  type LoginFormValues,
} from '../domain/auth.schema';
import { useCurrentAccount, useLogin } from '../hooks/use-auth';
import { AuthError } from '../services/auth.service';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentAccount();
  const loginMutation = useLogin();
  const [topError, setTopError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues, unknown, LoginFormParsed>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit: SubmitHandler<LoginFormParsed> = async (values) => {
    setTopError(null);
    try {
      await loginMutation.mutateAsync(values);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof AuthError) {
        setTopError(err.message);
      } else {
        setTopError(t('auth.unexpectedError'));
      }
    }
  };

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/cadastro" className="font-semibold text-accent hover:underline">
            {t('auth.signupCta')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          label={t('auth.email')}
          htmlFor="email"
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField
          label={t('auth.password')}
          htmlFor="password"
          error={errors.password?.message}
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>

        {topError && (
          <p className="rounded-xl bg-failure/10 px-3 py-2 text-sm text-failure">
            {topError}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? t('common.loading') : t('auth.login')}
        </Button>
      </form>
    </AuthShell>
  );
}
