import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, LineChart, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ComponentType } from 'react';
import { cn } from '@/shared/lib/cn';
import { Logo } from './logo';
import { useProfileQuery } from '@/modules/profile/hooks/use-profile';
import { useCurrentAccount } from '@/modules/auth/hooks/use-auth';

type Item = {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

export function Sidebar() {
  const { t } = useTranslation();
  const { data: profile } = useProfileQuery();
  const { email } = useCurrentAccount();

  const items: readonly Item[] = [
    { to: '/', label: t('nav.home'), Icon: Home },
    { to: '/treino', label: t('nav.workouts'), Icon: Dumbbell },
    { to: '/progresso', label: t('nav.progress'), Icon: LineChart },
    { to: '/perfil', label: t('nav.profile'), Icon: User },
  ];

  const displayName =
    profile?.name?.trim() ||
    (email ? email.split('@')[0] : '') ||
    t('home.greetingAnon');
  const initial = displayName.charAt(0).toUpperCase() || 'F';

  return (
    <aside
      className="hidden md:flex w-60 shrink-0 flex-col border-r border-line/60 bg-app px-4 py-6"
      aria-label="Navegação principal"
    >
      <Logo size="md" showWordmark className="px-2" />

      <nav className="mt-10 flex flex-col gap-1">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent/15 text-fg'
                  : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-line/60 bg-surface/60 p-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent"
            aria-hidden="true"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">
              {displayName}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-fg-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              {t('sidebar.synced')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
