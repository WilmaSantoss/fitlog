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
  signupSchema,
  type SignupFormParsed,
  type SignupFormValues,
} from '../domain/auth.schema';
import { useCurrentAccount, useSignup } from '../hooks/use-auth';
import { AuthError } from '../services/auth.service';

export function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentAccount();
  const signupMutation = useSignup();
  const [topError, setTopError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues, unknown, SignupFormParsed>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit: SubmitHandler<SignupFormParsed> = async (values) => {
    setTopError(null);
    try {
      await signupMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
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
      title={t('auth.signupTitle')}
      subtitle={t('auth.signupSubtitle')}
      footer={
        <>
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            {t('auth.loginCta')}
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
          hint={t('auth.passwordHint')}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <FormField
          label={t('auth.confirmPassword')}
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
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
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? t('common.loading') : t('auth.signup')}
        </Button>
      </form>
    </AuthShell>
  );
}
