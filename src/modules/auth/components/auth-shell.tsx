import type { ReactNode } from 'react';
import { Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-app px-4 py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(circle_at_80%_85%,rgba(56,189,248,0.10),transparent_55%)]"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-2 text-center">
          <div className="rounded-lg bg-accent/15 p-3 shadow-lg shadow-accent/10 ring-1 ring-accent/20">
            <Dumbbell className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            {t('app.name')}
          </h1>
          <p className="text-sm text-fg-muted">{t('app.tagline')}</p>
        </div>

        <div className="rounded-xl border border-line/70 bg-surface/90 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-fg">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
            )}
          </div>
          {children}
        </div>

        {footer && (
          <p className="mt-5 text-center text-sm text-fg-muted">{footer}</p>
        )}
      </div>
    </div>
  );
}
